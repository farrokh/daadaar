export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto font-sans">
      {children}
    </div>
  );
}
