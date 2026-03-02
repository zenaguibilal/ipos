export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="h-screen">{children}</main>;
}
