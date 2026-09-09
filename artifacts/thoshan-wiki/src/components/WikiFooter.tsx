import { Link } from "wouter";

export default function WikiFooter() {
  return (
    <footer className="wiki-footer border-t border-border mt-8 py-6 px-4 text-xs text-muted-foreground">
      <div className="max-w-[1400px] mx-auto">
        <p className="mb-3 leading-relaxed">
          Thoshan&apos;s Wiki is a personal editorial knowledge base by{" "}
          <strong>Lingadevaru H P</strong>. Content is documented for learning
          and reference, not as financial, legal, or security advice.
        </p>
        <div className="wiki-footer-links flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/wiki/about">About</Link>
          <Link href="/wiki/home">Wiki Home</Link>
          <Link href="/wiki/foss-coin">FOSS Coin</Link>
          <a
            href="https://github.com/lingadevaru-hp"
            target="_blank"
            rel="me noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/lingadevaruhp"
            target="_blank"
            rel="me noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            href="https://huggingface.co/lingadevaruhp"
            target="_blank"
            rel="me noopener noreferrer"
          >
            HuggingFace
          </a>
          <a
            href="https://kaggle.com/lingadevaruhp"
            target="_blank"
            rel="me noopener noreferrer"
          >
            Kaggle
          </a>
          <a
            href="https://twitter.com/lingadevaruhp"
            target="_blank"
            rel="me noopener noreferrer"
          >
            Twitter/X
          </a>
          <a href="mailto:contact@lingadevaru.in">Contact</a>
        </div>
      </div>
    </footer>
  );
}
