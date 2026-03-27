import { redirect } from 'next/navigation';

/**
 * @fileOverview Root Redirect
 * توجيه مباشر إلى مركز القيادة.
 */
export default async function RootPage() {
  redirect('/dashboard');
}
