
import { useTranslations } from 'next-intl';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-10 md:py-16 max-w-4xl mx-auto">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  );
}
