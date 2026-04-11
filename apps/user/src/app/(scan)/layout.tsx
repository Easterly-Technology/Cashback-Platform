export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="mx-auto max-w-2xl px-4 py-6 sm:px-5">{children}</main>;
}
