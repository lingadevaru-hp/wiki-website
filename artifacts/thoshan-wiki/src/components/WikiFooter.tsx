export default function WikiFooter() {
  return (
    <footer className="border-t border-border mt-8 py-4 px-4 text-xs text-muted-foreground">
      <div className="max-w-[1400px] mx-auto">
        <p className="mb-2">
          Thoshan&apos;s Wiki is a personal editorial knowledge base. Content is
          documented for learning and reference, not as financial, legal, or
          security advice.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/wiki/about" className="hover:underline">
            About
          </a>
          <a href="/wiki/home" className="hover:underline">
            Wiki Home
          </a>
          <a
            href="https://github.com/lingadevaru-hp"
            className="hover:underline"
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
