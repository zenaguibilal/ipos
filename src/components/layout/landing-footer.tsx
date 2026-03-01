'use client';

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} iPOS. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
