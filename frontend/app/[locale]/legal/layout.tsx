export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto font-sans">
      <div className="prose dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h1:text-4xl prose-h1:md:text-6xl prose-h1:mb-16 prose-h1:leading-[1.1]
        prose-h2:text-2xl prose-h2:font-medium prose-h2:mt-16 prose-h2:mb-8
        prose-h3:text-xl prose-h3:font-medium prose-h3:mt-10 prose-h3:mb-4
        prose-p:text-lg prose-p:leading-relaxed prose-p:font-light prose-p:text-foreground/80 prose-p:mb-8
        prose-ul:my-8 prose-li:text-lg prose-li:font-light prose-li:text-foreground/80
        prose-strong:font-medium prose-strong:text-foreground/90
      ">
        {children}
      </div>
    </div>
  );
}
