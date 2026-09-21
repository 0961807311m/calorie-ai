import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isPublic = req.nextUrl.pathname === '/' || isAuthPage;

  if (!user && !isPublic) return NextResponse.redirect(new URL('/auth', req.url));
  if (user && isAuthPage) return NextResponse.redirect(new URL('/dashboard', req.url));
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};