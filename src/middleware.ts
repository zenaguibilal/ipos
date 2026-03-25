import { NextResponse, type NextRequest } from 'next/server';

// This is a minimal middleware to bypass the Supabase integration issues
// that were causing startup errors. The application will rely on client-side
// session management and synchronization.
export function middleware(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
