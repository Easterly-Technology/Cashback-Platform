export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 lg:py-12">
      {children}
    </main>
  );
}
