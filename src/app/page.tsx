import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware handles redirection logic.
  // This page can simply redirect to the main 'sell' page.
  redirect('/sell');
}
