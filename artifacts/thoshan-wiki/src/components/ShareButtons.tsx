import { useState } from 'react';
import { Twitter, Linkedin, Copy, Check } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url: string;
  className?: string;
}

export default function ShareButtons({ title, url, className = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&title=${encodedTitle}&url=${encodedUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter"
        className="p-2 text-muted-foreground hover:text-accent hover:bg-card rounded-lg transition-colors"
      >
        <Twitter size={16} />
      </a>
      
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="p-2 text-muted-foreground hover:text-accent hover:bg-card rounded-lg transition-colors"
      >
        <Linkedin size={16} />
      </a>
      
      <button
        onClick={copyToClipboard}
        aria-label={copied ? 'Copied!' : 'Copy link'}
        className="p-2 text-muted-foreground hover:text-accent hover:bg-card rounded-lg transition-colors relative"
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
    </div>
  );
}
