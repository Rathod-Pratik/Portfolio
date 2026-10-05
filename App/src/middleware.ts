import { NextRequest, NextResponse } from 'next/server';
import { HOST } from '@/utils/constants';

export async function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get('admin');

  if (!adminCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const response = await fetch(`${HOST}/auth/check`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: `admin=${adminCookie.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/Dashboard/:path*'],
};
