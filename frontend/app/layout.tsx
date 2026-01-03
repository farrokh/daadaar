// Root layout - required for Next.js App Router
// This layout handles the root "/" route which redirects to the default locale
// The actual locale-specific layout is in [locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
