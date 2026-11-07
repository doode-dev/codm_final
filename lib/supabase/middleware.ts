import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const notFound = (req: NextRequest) =>
  NextResponse.rewrite(new URL("/404", req.url), { status: 404 });

// Refreshes the session on every request and gates /admin. This is the first gate, not the only one:
// app/admin/(panel)/layout.tsx checks again on the server, and the database rules (RLS) are the final word.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isAdmin =
    (path === "/admin" || path.startsWith("/admin/")) &&
    path !== "/admin/login";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return isAdmin ? notFound(request) : response; // fail closed

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options?: any }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(); // verifies the token with Supabase, unlike getSession()
  if (!isAdmin) return response;

  const to = (pathname: string, search = "") => {
    const u = request.nextUrl.clone();
    u.pathname = pathname;
    u.search = search;
    return NextResponse.redirect(u);
  };
  if (!user) return to("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || profile?.status !== "active")
    return notFound(request); // looks like a missing page

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2")
    return to("/auth/mfa", `?next=${encodeURIComponent(path)}`);
  return response;
}
