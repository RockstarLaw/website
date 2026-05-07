import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Build the response object first so cookie mutations can be written back.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies into both the request and the response
          // so the session stays fresh across page transitions.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() makes a live round-trip to Supabase auth — more reliable than
  // getSession() which only reads cookies and can return stale data.
  // On any error (network, Supabase down, expired token), user is null → fail closed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Return the supabaseResponse (not a new NextResponse) so any refreshed
  // session cookies set by the Supabase client are included in the response.
  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/starbiz/:path*"],
};
