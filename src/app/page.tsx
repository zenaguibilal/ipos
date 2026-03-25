import { redirect } from 'next/navigation';

export default function RootPage() {
  // The main app layout will handle redirection to /auth or a protected page like /sell
  // This page can simply redirect to the main app route.
  redirect('/sell');
}
