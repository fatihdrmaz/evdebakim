import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(req: NextRequest) {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_IMPERSONATE_USER_ID) return NextResponse.next({ request: req });
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!user && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (user && isLogin) return NextResponse.redirect(new URL("/", req.url));
  return res;
}
export const config = { matcher: ["/((?!_next|favicon.ico|manifest.json|icons).*)"] };
