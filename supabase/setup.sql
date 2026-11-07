-- CODM Accounts: complete database setup for a NEW Supabase project.
-- Paste this whole file into the SQL editor and run it ONCE. Then run seed-demo.sql if you want demo accounts.
-- Steps for sign-up, admin and payments are in the README.

-- ============ 1. Readable ids: CM-50000, O-10000, D-200, R-500, P-3000, T-100 ============
create sequence public.listing_seq start 50000;
create sequence public.order_seq   start 10000;
create sequence public.dispute_seq start 200;
create sequence public.report_seq  start 500;
create sequence public.payout_seq  start 3000;
create sequence public.ticket_seq  start 100;

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ============ 2. People ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  country text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'both', 'admin')),
  status text not null default 'active' check (status in ('active', 'banned')),
  seller_verification text not null default 'none' check (seller_verification in ('none', 'pending', 'verified', 'rejected')),
  seller_rating numeric(2, 1),
  completed_sales int not null default 0,
  created_at timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles (lower(username));

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active');
$$;

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "admins read all profiles" on public.profiles for select to authenticated using (public.is_admin());
-- Users can change only their username and country. Nobody can promote themselves or un-ban themselves.
revoke update on public.profiles from anon, authenticated;
grant update (username, country) on public.profiles to authenticated;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Seller profile: private contact details for anyone who sells.
create table public.sellers (
  id uuid primary key references public.profiles(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  whatsapp text not null,
  bio text not null default '' check (char_length(bio) <= 280),
  created_at timestamptz not null default now()
);
create unique index sellers_username_lower on public.sellers (lower(username));
alter table public.sellers enable row level security;
create policy "sellers read own seller profile" on public.sellers for select to authenticated using (id = (select auth.uid()));
create policy "sellers update own seller profile" on public.sellers for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "admins read seller profiles" on public.sellers for select to authenticated using (public.is_admin());
revoke all on public.sellers from anon, authenticated;
grant select on public.sellers to authenticated;
grant update (whatsapp, bio) on public.sellers to authenticated;

-- Runs when someone signs up. The sign-up form sends the choices as metadata; only buyer, seller or both is accepted
-- (never admin). If a seller filled in their seller details, the seller profile is created here too.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := m->>'role';
  final_role text := case when m->>'role' in ('buyer', 'seller', 'both') then m->>'role' else 'buyer' end;
  uname text := nullif(trim(m->>'username'), '');
  sname text := nullif(trim(m->>'seller_name'), '');
  wa text := nullif(trim(m->>'whatsapp'), '');
begin
  if uname is null or uname !~ '^[A-Za-z0-9_]{3,24}$' or exists (select 1 from public.profiles p where lower(p.username) = lower(uname)) then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  insert into public.profiles (id, username, country, role, seller_verification)
  values (new.id, uname, left(m->>'country', 60), final_role, case when final_role in ('seller', 'both') then 'pending' else 'none' end);

  if final_role in ('seller', 'both') and sname ~ '^[A-Za-z0-9_]{3,24}$' and wa ~ '^\+?[0-9][0-9 ()-]{6,19}$'
     and not exists (select 1 from public.sellers s where lower(s.username) = lower(sname)) then
    insert into public.sellers (id, username, whatsapp, bio) values (new.id, sname, wa, left(coalesce(m->>'bio', ''), 280));
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Lets the sign-up form check a name before submitting.
create function public.username_available(p_username text) returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;
create function public.seller_name_available(p_name text) returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.sellers where lower(username) = lower(p_name));
$$;
grant execute on function public.username_available(text), public.seller_name_available(text) to anon, authenticated;

-- A user who signed up as a buyer can start selling later. Buyer becomes "both"; nobody can become admin this way.
create function public.become_seller(p_username text, p_whatsapp text, p_bio text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r text;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  select p.role into r from public.profiles p where p.id = uid and p.status = 'active';
  if r is null then raise exception 'Your account is not active.'; end if;
  if r = 'admin' then raise exception 'Admin accounts cannot sell. Use a separate account.'; end if;
  if exists (select 1 from public.sellers s where s.id = uid) then raise exception 'You already have a seller profile.'; end if;
  insert into public.sellers (id, username, whatsapp, bio) values (uid, p_username, p_whatsapp, coalesce(p_bio, ''));
  update public.profiles
     set role = case when role = 'buyer' then 'both' else role end,
         seller_verification = case when seller_verification = 'none' then 'pending' else seller_verification end
   where id = uid;
end $$;
revoke all on function public.become_seller(text, text, text) from public, anon;
grant execute on function public.become_seller(text, text, text) to authenticated;

-- Public seller info for listing pages. WhatsApp and bio are NOT exposed.
create view public.seller_public as
  select p.id, coalesce(s.username, p.username) as username, p.seller_rating, p.completed_sales, p.seller_verification, p.created_at
  from public.profiles p left join public.sellers s on s.id = p.id
  where p.role in ('seller', 'both') and p.status = 'active';
grant select on public.seller_public to anon, authenticated;

-- ============ 3. Settings ============
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (key, value) values
  ('seller_commission_pct', '10'), ('buyer_fee_pct', '5'), ('review_window_days', '3'), ('reservation_minutes', '60'),
  ('auto_approve_verified_sellers', 'false'), ('maintenance_mode', 'false');
alter table public.site_settings enable row level security;
create policy "anyone reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admins change settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ 4. Listings ============
create table public.listings (
  id text primary key default 'CM-' || nextval('public.listing_seq'),
  slug text not null,
  title text not null,
  status text not null default 'pending_review' check (status in
    ('draft', 'pending_review', 'active', 'reserved', 'sold', 'rejected', 'withdrawn', 'suspended', 'expired', 'removed')),
  seller_id uuid not null references public.profiles(id),
  featured boolean not null default false,
  views int not null default 0,
  favorites int not null default 0,
  region text not null,
  platform text not null check (platform in ('Android', 'iOS')),
  game_version text,
  level int not null,
  mp_rank text not null,
  mp_ranked_season text,
  br_rank text not null,
  inventory jsonb not null default '{}',
  cp int not null default 0,
  credits int not null default 0,
  access jsonb not null default '{}',          -- signInMethod, transferLimitations, recoveryDependencies (never passwords)
  proof_provided boolean not null default false,
  proof_redacted boolean not null default true,
  media jsonb not null default '[]',
  price_cents int not null check (price_cents > 0),
  previous_price_cents int,
  currency text not null default 'USD',
  buyer_fee_pct numeric not null default 5,
  risk jsonb not null default '{}',
  verification_status text not null default 'seller_declared' check (verification_status in ('attributes_verified', 'seller_declared')),
  moderation_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_status_created on public.listings (status, created_at desc);
create index listings_seller on public.listings (seller_id);
create trigger listings_updated before update on public.listings for each row execute function public.set_updated_at();

-- ============ 5. Orders and everything around them ============
create table public.orders (
  id text primary key default 'O-' || nextval('public.order_seq'),
  listing_id text not null references public.listings(id),
  listing_title text not null default '',
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  price_cents int not null check (price_cents > 0),
  buyer_fee_cents int not null default 0 check (buyer_fee_cents >= 0),
  commission_cents int not null default 0 check (commission_cents >= 0),
  total_cents int not null check (total_cents > 0),
  currency text not null default 'USD',
  status text not null default 'created' check (status in
    ('created', 'awaiting_payment', 'paid', 'under_review', 'completed', 'payment_failed', 'cancelled', 'refund_pending', 'refunded', 'disputed')),
  payment_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
-- A listing can only have one live order, so it can never be sold twice.
create unique index one_live_order_per_listing on public.orders (listing_id)
  where status in ('created', 'awaiting_payment', 'paid', 'under_review', 'completed', 'disputed', 'refund_pending');
create index orders_buyer on public.orders (buyer_id);
create index orders_seller on public.orders (seller_id);
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
create policy "parties read own orders" on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));
create policy "admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Orders are created by checkout_cart() and changed by the functions below, never by direct writes.

-- Listing visibility (needs orders to exist)
alter table public.listings enable row level security;
create policy "anyone reads active listings" on public.listings for select to anon, authenticated using (status = 'active');
create policy "sellers read own listings" on public.listings for select to authenticated using (seller_id = (select auth.uid()));
create policy "buyers read ordered listings" on public.listings for select to authenticated
  using (exists (select 1 from public.orders o where o.listing_id = listings.id and o.buyer_id = (select auth.uid())));
create policy "admins manage listings" on public.listings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "sellers create listings" on public.listings for insert to authenticated
  with check (
    seller_id = (select auth.uid()) and status in ('draft', 'pending_review')
    and featured = false and views = 0 and favorites = 0 and verification_status = 'seller_declared'
    and reviewed_at is null and moderation_notes is null
    and exists (select 1 from public.sellers s where s.id = (select auth.uid()))
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('seller', 'both') and p.status = 'active')
  );
create policy "sellers edit own listings" on public.listings for update to authenticated
  using (seller_id = (select auth.uid()) and status in ('draft', 'pending_review', 'active', 'rejected', 'withdrawn', 'expired'))
  with check (seller_id = (select auth.uid()));
create policy "sellers delete own listings" on public.listings for delete to authenticated
  using (seller_id = (select auth.uid()) and status in ('draft', 'rejected', 'withdrawn', 'expired'));

-- On INSERT the platform, not the seller, decides the fee and currency.
create function public.listings_defaults() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.buyer_fee_pct := coalesce((select (value #>> '{}')::numeric from public.site_settings where key = 'buyer_fee_pct'), 5);
    new.currency := 'USD';
  end if;
  return new;
end $$;
create trigger listings_defaults before insert on public.listings for each row execute function public.listings_defaults();

-- On UPDATE a seller can't touch moderation fields or counters, and can't approve themselves.
create function public.listings_guard() returns trigger language plpgsql set search_path = '' as $$
declare frozen text[] := array['price_cents', 'previous_price_cents', 'updated_at'];
begin
  -- Admins, the SQL editor, the service role and our own security definer functions are not restricted.
  if current_user not in ('authenticated', 'anon') or public.is_admin() then return new; end if;
  new.id := old.id; new.seller_id := old.seller_id; new.featured := old.featured;
  new.views := old.views; new.favorites := old.favorites; new.created_at := old.created_at;
  new.verification_status := old.verification_status; new.reviewed_at := old.reviewed_at;
  new.moderation_notes := old.moderation_notes; new.buyer_fee_pct := old.buyer_fee_pct; new.currency := old.currency;
  if new.status is distinct from old.status and not (
       (old.status in ('draft', 'rejected', 'withdrawn', 'expired', 'active') and new.status = 'pending_review')
    or (old.status in ('active', 'pending_review') and new.status = 'withdrawn')
    or (old.status = 'withdrawn' and new.status = 'draft')
  ) then raise exception 'A listing cannot move from % to %.', old.status, new.status; end if;
  if old.status = 'active' and new.status = 'active' and (to_jsonb(new) - frozen) is distinct from (to_jsonb(old) - frozen) then
    raise exception 'Only the price can change while a listing is live. Edit it to send it back to review.';
  end if;
  return new;
end $$;
create trigger listings_guard before update on public.listings for each row execute function public.listings_guard();

-- Admin setting "auto-approve verified sellers": goes live straight away when a verified seller submits.
create function public.listings_auto_approve() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pending_review'
     and coalesce((select (value #>> '{}')::boolean from public.site_settings where key = 'auto_approve_verified_sellers'), false)
     and exists (select 1 from public.profiles p where p.id = new.seller_id and p.seller_verification = 'verified' and p.status = 'active') then
    update public.listings set status = 'active', reviewed_at = now(), moderation_notes = 'Auto-approved' where id = new.id;
  end if;
  return null;
end $$;
create trigger listings_auto_approve after insert or update of status on public.listings for each row execute function public.listings_auto_approve();

-- Order lifecycle: these keep listings, payouts and seller stats in step with the order.
create function public.orders_before_update() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then new.paid_at := now(); end if;
  return new;
end $$;
create trigger orders_before_update before update on public.orders for each row execute function public.orders_before_update();

create table public.payouts (
  id text primary key default 'P-' || nextval('public.payout_seq'),
  seller_id uuid not null references public.profiles(id),
  order_id text not null references public.orders(id),
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'on_hold', 'paid')),
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);
create unique index payouts_one_per_order on public.payouts (order_id);
alter table public.payouts enable row level security;
create policy "sellers read own payouts" on public.payouts for select to authenticated using (seller_id = (select auth.uid()));
create policy "admins manage payouts" on public.payouts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.orders_after_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status then return null; end if;
  if new.status = 'completed' then
    update public.listings set status = 'sold' where id = new.listing_id;
    insert into public.payouts (seller_id, order_id, amount_cents) values (new.seller_id, new.id, new.price_cents - new.commission_cents)
      on conflict (order_id) do update set status = case when public.payouts.status = 'on_hold' then 'pending' else public.payouts.status end;
  elsif new.status = 'disputed' then
    update public.payouts set status = 'on_hold' where order_id = new.id and status = 'pending';
  elsif new.status in ('cancelled', 'payment_failed') then
    update public.listings set status = 'active' where id = new.listing_id and status = 'reserved';
  elsif new.status = 'refunded' then
    update public.listings set status = 'withdrawn' where id = new.listing_id and status in ('reserved', 'sold');
    update public.payouts set status = 'on_hold' where order_id = new.id and status = 'pending';
  end if;
  update public.profiles set completed_sales = (select count(*) from public.orders o where o.seller_id = new.seller_id and o.status = 'completed')
   where id = new.seller_id;
  return null;
end $$;
create trigger orders_after_status after update of status on public.orders for each row execute function public.orders_after_status();

-- Unpaid orders release their listing after the reservation window.
create function public.expire_stale_orders() returns int language plpgsql security definer set search_path = '' as $$
declare minutes int := coalesce((select (value #>> '{}')::int from public.site_settings where key = 'reservation_minutes'), 60); n int;
begin
  update public.orders set status = 'cancelled'
   where status in ('created', 'awaiting_payment') and created_at < now() - make_interval(mins => minutes);
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.expire_stale_orders() to authenticated;
-- Optional, to also run it on a timer (Database > Extensions > pg_cron):
-- select cron.schedule('expire-orders', '*/10 * * * *', 'select public.expire_stale_orders()');

-- Cart
create table public.cart_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id text not null references public.listings(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.cart_items enable row level security;
create policy "read own cart" on public.cart_items for select to authenticated using (user_id = (select auth.uid()));
create policy "add to own cart" on public.cart_items for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.listings l where l.id = cart_items.listing_id and l.status = 'active' and l.seller_id <> (select auth.uid())));
create policy "remove from own cart" on public.cart_items for delete to authenticated using (user_id = (select auth.uid()));
create function public.cart_limit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.cart_items where user_id = new.user_id) >= 10 then raise exception 'Your cart is full. You can hold up to 10 accounts.'; end if;
  return new;
end $$;
create trigger cart_limit before insert on public.cart_items for each row execute function public.cart_limit();

-- Checkout: turns the cart into orders in one transaction and reserves each account so nobody else can buy it.
create function public.checkout_cart(p_listing_ids text[]) returns setof text language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  l record; fee_pct numeric; comm_pct numeric; fee int; comm int; oid text; made text[] := array[]::text[];
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.profiles where id = uid and status = 'active') then raise exception 'Your account is not active.'; end if;
  if coalesce((select (value #>> '{}')::boolean from public.site_settings where key = 'maintenance_mode'), false) then
    raise exception 'Checkout is paused for maintenance. Please try again soon.';
  end if;
  if p_listing_ids is null or cardinality(p_listing_ids) = 0 then raise exception 'Your cart is empty.'; end if;
  if cardinality(p_listing_ids) > 10 then raise exception 'You can check out up to 10 accounts at a time.'; end if;

  perform public.expire_stale_orders();
  fee_pct := coalesce((select (value #>> '{}')::numeric from public.site_settings where key = 'buyer_fee_pct'), 5);
  comm_pct := coalesce((select (value #>> '{}')::numeric from public.site_settings where key = 'seller_commission_pct'), 10);

  for l in select li.id, li.title, li.price_cents, li.seller_id, li.status from public.listings li
            where li.id = any(p_listing_ids) order by li.id for update loop
    if l.status <> 'active' or not exists (select 1 from public.profiles p where p.id = l.seller_id and p.status = 'active') then
      raise exception '"%" is no longer available.', l.title;
    end if;
    if l.seller_id = uid then raise exception 'You can''t buy your own account ("%").', l.title; end if;
    fee := round(l.price_cents * fee_pct / 100.0);
    comm := round(l.price_cents * comm_pct / 100.0);
    insert into public.orders (listing_id, listing_title, buyer_id, seller_id, price_cents, buyer_fee_cents, commission_cents, total_cents, status)
      values (l.id, l.title, uid, l.seller_id, l.price_cents, fee, comm, l.price_cents + fee, 'awaiting_payment') returning id into oid;
    update public.listings set status = 'reserved' where id = l.id;
    made := made || oid;
  end loop;

  if cardinality(made) <> (select count(distinct x) from unnest(p_listing_ids) x) then
    raise exception 'Some accounts in your cart are no longer available.';
  end if;
  delete from public.cart_items where user_id = uid and listing_id = any(p_listing_ids);
  return query select unnest(made);
end $$;
revoke all on function public.checkout_cart(text[]) from public, anon;
grant execute on function public.checkout_cart(text[]) to authenticated;

-- What a buyer can do to their own order.
create function public.cancel_order(p_order text) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'cancelled' where id = p_order and buyer_id = (select auth.uid()) and status in ('created', 'awaiting_payment');
  if not found then raise exception 'This order can''t be cancelled.'; end if;
end $$;
create function public.confirm_order(p_order text) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'completed' where id = p_order and buyer_id = (select auth.uid()) and status in ('paid', 'under_review');
  if not found then raise exception 'This order can''t be confirmed right now.'; end if;
end $$;

create table public.disputes (
  id text primary key default 'D-' || nextval('public.dispute_seq'),
  order_id text not null references public.orders(id),
  opened_by uuid not null references public.profiles(id),
  reason text not null,
  evidence_count int not null default 0,
  status text not null default 'open' check (status in ('open', 'resolved_buyer', 'resolved_seller')),
  note text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.disputes enable row level security;
create policy "parties read own disputes" on public.disputes for select to authenticated
  using (opened_by = (select auth.uid()) or exists (
    select 1 from public.orders o where o.id = disputes.order_id and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))));
create policy "admins manage disputes" on public.disputes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.open_dispute(p_order text, p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); o record; days int := coalesce((select (value #>> '{}')::int from public.site_settings where key = 'review_window_days'), 3);
begin
  select * into o from public.orders where id = p_order and buyer_id = uid for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.status not in ('paid', 'under_review', 'completed') then raise exception 'You can''t open a dispute on this order.'; end if;
  if now() > coalesce(o.paid_at, o.created_at) + make_interval(days => days) then
    raise exception 'The review window for this order has closed. Please contact support.';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 10 then raise exception 'Describe the problem in at least 10 characters.'; end if;
  if exists (select 1 from public.disputes d where d.order_id = p_order and d.status = 'open') then raise exception 'A dispute is already open on this order.'; end if;
  insert into public.disputes (order_id, opened_by, reason) values (p_order, uid, trim(p_reason));
  update public.orders set status = 'disputed' where id = p_order;
end $$;
revoke all on function public.cancel_order(text), public.confirm_order(text), public.open_dispute(text, text) from public, anon;
grant execute on function public.cancel_order(text), public.confirm_order(text), public.open_dispute(text, text) to authenticated;

-- Marks an order paid. ONLY the server (service role) can call this: used by test payments and, later, payment webhooks.
create function public.set_order_paid(p_order text, p_ref text) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'paid', payment_ref = p_ref where id = p_order and status = 'awaiting_payment';
  if not found then raise exception 'Order % is not waiting for payment.', p_order; end if;
end $$;
revoke all on function public.set_order_paid(text, text) from public, anon, authenticated;
grant execute on function public.set_order_paid(text, text) to service_role;

-- Buyer and seller talk on the order page.
create table public.order_messages (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index order_messages_order on public.order_messages (order_id, created_at);
alter table public.order_messages enable row level security;
create policy "parties read order messages" on public.order_messages for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_messages.order_id and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))));
create policy "parties write order messages" on public.order_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (
    select 1 from public.orders o where o.id = order_messages.order_id and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))
      and o.status in ('paid', 'under_review', 'completed', 'disputed', 'refund_pending')));
create policy "admins manage order messages" on public.order_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ 6. Favorites, reports, support, audit ============
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id text not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "manage own favorites" on public.favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create function public.sync_favorites() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then update public.listings set favorites = favorites + 1 where id = new.listing_id;
  else update public.listings set favorites = greatest(favorites - 1, 0) where id = old.listing_id; end if;
  return null;
end $$;
create trigger favorites_count after insert or delete on public.favorites for each row execute function public.sync_favorites();

create table public.reports (
  id text primary key default 'R-' || nextval('public.report_seq'),
  target_type text not null check (target_type in ('listing', 'user')),
  target_id text not null,
  reporter_id uuid not null references public.profiles(id),
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "signed in users can report" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "read own reports" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy "admins manage reports" on public.reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.support_tickets (
  id text primary key default 'T-' || nextval('public.ticket_seq'),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 4000),
  order_id text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
create policy "anyone can contact support" on public.support_tickets for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "read own tickets" on public.support_tickets for select to authenticated using (user_id = (select auth.uid()));
create policy "admins manage tickets" on public.support_tickets for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.audit_logs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  target text not null,
  note text
);
alter table public.audit_logs enable row level security;
create policy "admins read audit log" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "admins write audit log" on public.audit_logs for insert to authenticated with check (public.is_admin() and actor_id = (select auth.uid()));
revoke update, delete on public.audit_logs from anon, authenticated;

-- ============ 7. Admin functions (they refuse to run unless the caller is an active admin) ============
create function public.admin_users() returns table (id uuid, username text, email text, country text, role text, status text, email_verified boolean,
  seller_verification text, joined_at timestamptz, last_login timestamptz, orders bigint, sales bigint, reports bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
    select p.id, p.username, u.email::text, p.country, p.role, p.status, (u.email_confirmed_at is not null), p.seller_verification, p.created_at, u.last_sign_in_at,
           (select count(*) from public.orders o where o.buyer_id = p.id),
           (select count(*) from public.orders o where o.seller_id = p.id and o.status = 'completed'),
           (select count(*) from public.reports r where r.target_type = 'user' and r.target_id = p.id::text)
    from public.profiles p join auth.users u on u.id = p.id order by p.created_at desc;
end $$;

create function public.admin_set_user_status(target uuid, new_status text) returns int language plpgsql security definer set search_path = '' as $$
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
  end if;
  return n;
end $$;

create function public.admin_set_seller_verification(target uuid, new_value text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if new_value not in ('none', 'pending', 'verified', 'rejected') then raise exception 'Unknown value'; end if;
  update public.profiles set seller_verification = new_value where id = target;
end $$;
revoke all on function public.admin_users(), public.admin_set_user_status(uuid, text), public.admin_set_seller_verification(uuid, text) from public, anon;
grant execute on function public.admin_users(), public.admin_set_user_status(uuid, text), public.admin_set_seller_verification(uuid, text) to authenticated;

-- ============ 8. Insights ============
create function public.record_listing_view(listing text) returns void language sql security definer set search_path = '' as $$
  update public.listings set views = views + 1 where id = listing and status = 'active';
$$;
revoke all on function public.record_listing_view(text) from public;
grant execute on function public.record_listing_view(text) to anon, authenticated;

-- ============ 9. Screenshots (a public bucket; sellers can only use a folder named after their own user id) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-media', 'listing-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
create policy "sellers upload own screenshots" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-media' and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('seller', 'both') and p.status = 'active'));
create policy "sellers read own screenshots" on storage.objects for select to authenticated
  using (bucket_id = 'listing-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "sellers delete own screenshots" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ============ 10. Make yourself the owner ============
-- Register on the site first, then uncomment this, put your email in, and run just this statement:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
