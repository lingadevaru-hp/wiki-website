export default function WikiFooter() {
  return (
    <footer className="border-t border-border mt-8 py-6 px-4 text-xs text-muted-foreground">
      <div className="max-w-[1400px] mx-auto">
        <p className="mb-3 leading-relaxed">
          Thoshan&apos;s Wiki is a personal editorial knowledge base. Content is
          documented for learning and reference, not as financial, legal, or
          security advice.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="/wiki/about">About</a>
          <a href="/wiki/home">Wiki Home</a>
          <a
            href="https://github.com/lingadevaru-hp"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
