-- Upgrade 1: run this AFTER setup.sql (once). Phone verification, Paystack payments, admin two-factor, abuse limits.
-- It is written for the database created by setup.sql, with or without the demo seed.

-- ============ 1. Phone number instead of WhatsApp ============
alter table public.sellers rename column whatsapp to phone;
alter table public.sellers add constraint sellers_phone_format check (phone ~ '^\+[1-9][0-9]{7,14}$') not valid;
revoke update on public.sellers from authenticated;
grant update (phone, bio) on public.sellers to authenticated;

-- True when the seller's saved number has been confirmed by a text-message code (Supabase phone login).
create or replace function public.seller_phone_verified() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sellers s join auth.users u on u.id = s.id
    where s.id = (select auth.uid()) and u.phone_confirmed_at is not null
      and regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g') = regexp_replace(s.phone, '[^0-9]', '', 'g'));
$$;
create or replace function public.is_active() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'active');
$$;
revoke all on function public.seller_phone_verified(), public.is_active() from public, anon;
grant execute on function public.seller_phone_verified(), public.is_active() to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  final_role text := case when m->>'role' in ('buyer', 'seller', 'both') then m->>'role' else 'buyer' end;
  uname text := nullif(trim(m->>'username'), '');
  sname text := nullif(trim(m->>'seller_name'), '');
  ph text := regexp_replace(coalesce(m->>'phone', ''), '[\s()-]', '', 'g');
begin
  if uname is null or uname !~ '^[A-Za-z0-9_]{3,24}$' or exists (select 1 from public.profiles p where lower(p.username) = lower(uname)) then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  insert into public.profiles (id, username, country, role, seller_verification)
  values (new.id, uname, left(m->>'country', 60), final_role, case when final_role in ('seller', 'both') then 'pending' else 'none' end);
  if final_role in ('seller', 'both') and sname ~ '^[A-Za-z0-9_]{3,24}$' and ph ~ '^\+[1-9][0-9]{7,14}$'
     and not exists (select 1 from public.sellers s where lower(s.username) = lower(sname)) then
    insert into public.sellers (id, username, phone, bio) values (new.id, sname, ph, left(coalesce(m->>'bio', ''), 280));
  end if;
  return new;
end $$;

drop function if exists public.become_seller(text, text, text);
create function public.become_seller(p_username text, p_phone text, p_bio text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r text;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  select p.role into r from public.profiles p where p.id = uid and p.status = 'active';
  if r is null then raise exception 'Your account is not active.'; end if;
  if r = 'admin' then raise exception 'Admin accounts cannot sell. Use a separate account.'; end if;
  if exists (select 1 from public.sellers s where s.id = uid) then raise exception 'You already have a seller profile.'; end if;
  insert into public.sellers (id, username, phone, bio) values (uid, p_username, p_phone, coalesce(p_bio, ''));
  update public.profiles
     set role = case when role = 'buyer' then 'both' else role end,
         seller_verification = case when seller_verification = 'none' then 'pending' else seller_verification end
   where id = uid;
end $$;
revoke all on function public.become_seller(text, text, text) from public, anon;
grant execute on function public.become_seller(text, text, text) to authenticated;

-- Sellers can only list (and upload screenshots) after their phone number is verified.
drop policy "sellers create listings" on public.listings;
create policy "sellers create listings" on public.listings for insert to authenticated
  with check (
    seller_id = (select auth.uid()) and status in ('draft', 'pending_review')
    and featured = false and views = 0 and favorites = 0 and verification_status = 'seller_declared'
    and reviewed_at is null and moderation_notes is null
    and exists (select 1 from public.sellers s where s.id = (select auth.uid()))
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('seller', 'both') and p.status = 'active')
    and public.seller_phone_verified()
  );
drop policy "sellers upload own screenshots" on storage.objects;
create policy "sellers upload own screenshots" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-media' and (storage.foldername(name))[1] = (select auth.uid())::text and public.seller_phone_verified());

-- ============ 2. Admin needs two-factor (the database refuses admin actions without it) ============
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active')
     and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

-- ============ 3. Paystack payments ============
create table public.payments (
  reference text primary key,
  user_id uuid not null references public.profiles(id),
  order_ids text[] not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null,
  fx_rate numeric not null default 1,
  gateway text not null default 'paystack',
  gateway_id text,
  status text not null default 'initialized' check (status in ('initialized', 'success', 'failed', 'needs_review', 'resolved')),
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_user on public.payments (user_id);
alter table public.payments enable row level security;
create policy "read own payments" on public.payments for select to authenticated using (user_id = (select auth.uid()));
create policy "admins manage payments" on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke insert, update, delete on public.payments from anon, authenticated;
grant update on public.payments to authenticated;  -- admins only, through the policy above

-- Called by our server after Paystack confirms a payment. It checks the amount, then marks every order in the payment paid, once.
create or replace function public.settle_payment(p_reference text, p_amount bigint, p_currency text, p_gateway_id text) returns text
language plpgsql security definer set search_path = '' as $$
declare pay record; oid text; o record; bad boolean := false;
begin
  select * into pay from public.payments where reference = p_reference for update;
  if not found then return 'unknown_reference'; end if;
  if pay.status <> 'initialized' then return pay.status; end if;   -- already handled: safe to call twice

  if p_amount <> pay.amount_minor or upper(p_currency) <> upper(pay.currency) then
    update public.payments set status = 'needs_review', gateway_id = p_gateway_id, paid_at = now(),
      note = 'The amount or currency paid did not match the order. Check it in Paystack.' where reference = p_reference;
    return 'needs_review';
  end if;

  foreach oid in array pay.order_ids loop
    select * into o from public.orders where id = oid for update;
    if not found or o.status <> 'awaiting_payment' then bad := true; end if;
  end loop;
  if bad then
    update public.payments set status = 'needs_review', gateway_id = p_gateway_id, paid_at = now(),
      note = 'Paid, but an order had already expired or been cancelled. Refund the buyer or reinstate the order.' where reference = p_reference;
    return 'needs_review';
  end if;

  foreach oid in array pay.order_ids loop
    update public.orders set status = 'paid', payment_ref = p_reference where id = oid;
  end loop;
  update public.payments set status = 'success', gateway_id = p_gateway_id, paid_at = now() where reference = p_reference;
  return 'success';
end $$;
revoke all on function public.settle_payment(text, bigint, text, text) from public, anon, authenticated;
grant execute on function public.settle_payment(text, bigint, text, text) to service_role;

-- ============ 4. Banned users lose their sessions, and can't use the shop ============
drop policy "add to own cart" on public.cart_items;
create policy "add to own cart" on public.cart_items for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active() and exists (
    select 1 from public.listings l where l.id = cart_items.listing_id and l.status = 'active' and l.seller_id <> (select auth.uid())));
drop policy "parties write order messages" on public.order_messages;
create policy "parties write order messages" on public.order_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_active() and exists (
    select 1 from public.orders o where o.id = order_messages.order_id and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))
      and o.status in ('paid', 'under_review', 'completed', 'disputed', 'refund_pending')));
drop policy "signed in users can report" on public.reports;
create policy "signed in users can report" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and public.is_active());
drop policy "manage own favorites" on public.favorites;
create policy "manage own favorites" on public.favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.is_active());

create or replace function public.admin_set_user_status(target uuid, new_status text) returns int language plpgsql security definer set search_path = '' as $$
declare n int := 0;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if new_status not in ('active', 'banned') then raise exception 'Unknown status'; end if;
  if target = (select auth.uid()) then raise exception 'You cannot change your own account.'; end if;
  if exists (select 1 from public.profiles p where p.id = target and p.role = 'admin') then raise exception 'Admin accounts cannot be banned here.'; end if;
  update public.profiles set status = new_status where id = target;
  if new_status = 'banned' then
    update public.listings set status = 'suspended', featured = false where seller_id = target and status in ('active', 'pending_review', 'reserved');
    get diagnostics n = row_count;
    begin delete from auth.sessions where user_id = target; exception when others then null; end;  -- sign them out everywhere
  end if;
  return n;
end $$;

drop function public.admin_users();
create function public.admin_users() returns table (id uuid, username text, email text, country text, role text, status text, email_verified boolean,
  seller_verification text, joined_at timestamptz, last_login timestamptz, orders bigint, sales bigint, reports bigint, phone text, phone_verified boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
    select p.id, p.username, u.email::text, p.country, p.role, p.status, (u.email_confirmed_at is not null), p.seller_verification, p.created_at, u.last_sign_in_at,
           (select count(*) from public.orders o where o.buyer_id = p.id),
           (select count(*) from public.orders o where o.seller_id = p.id and o.status = 'completed'),
           (select count(*) from public.reports r where r.target_type = 'user' and r.target_id = p.id::text),
           s.phone,
           (s.id is not null and u.phone_confirmed_at is not null
              and regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g') = regexp_replace(s.phone, '[^0-9]', '', 'g'))
    from public.profiles p join auth.users u on u.id = p.id left join public.sellers s on s.id = p.id
    order by p.created_at desc;
end $$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- ============ 5. Abuse limits (checked inside the database, so they can't be skipped) ============
create or replace function public.limit_rate() returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if tg_table_name = 'support_tickets' then
    select count(*) into n from public.support_tickets t where t.created_at > now() - interval '1 hour'
      and (lower(t.email) = lower(new.email) or (new.user_id is not null and t.user_id = new.user_id));
    if n >= 5 then raise exception 'Too many messages. Please wait a while before sending another.'; end if;
  elsif tg_table_name = 'order_messages' then
    select count(*) into n from public.order_messages m where m.sender_id = new.sender_id and m.created_at > now() - interval '10 minutes';
    if n >= 20 then raise exception 'You are sending messages too fast. Please slow down.'; end if;
  elsif tg_table_name = 'reports' then
    select count(*) into n from public.reports r where r.reporter_id = new.reporter_id and r.created_at > now() - interval '1 hour';
    if n >= 10 then raise exception 'You have sent many reports. Please wait before sending more.'; end if;
  elsif tg_table_name = 'listings' and current_user in ('authenticated', 'anon') then
    select count(*) into n from public.listings l where l.seller_id = new.seller_id and l.created_at > now() - interval '24 hours';
    if n >= 10 then raise exception 'You have created many listings today. Please try again tomorrow.'; end if;
  end if;
  return new;
end $$;
create trigger limit_support_tickets before insert on public.support_tickets for each row execute function public.limit_rate();
create trigger limit_order_messages before insert on public.order_messages for each row execute function public.limit_rate();
create trigger limit_reports before insert on public.reports for each row execute function public.limit_rate();
create trigger limit_listings before insert on public.listings for each row execute function public.limit_rate();
