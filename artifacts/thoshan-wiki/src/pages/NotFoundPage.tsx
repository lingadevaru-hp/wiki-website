import { useState } from 'react';
import { Link } from 'wouter';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import WikiFooter from '../components/WikiFooter';

export default function NotFoundPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-6">
          <h1 className="text-[1.95em] font-serif font-normal mb-4">Page not found</h1>
          <hr className="border-border mb-4" />
          <p className="text-sm mb-3">
            The page you requested does not exist in the Aethelgard Codex.
          </p>
          <p className="text-sm mb-3">
            You may want to:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mb-4">
            <li><Link href="/wiki/main-page" className="text-accent hover:underline">Return to the main page</Link></li>
            <li><Link href="/wiki/aethelgard" className="text-accent hover:underline">Read about Aethelgard</Link></li>
            <li><Link href="/wiki/search" className="text-accent hover:underline">Search for articles</Link></li>
          </ul>
        </main>
      </div>
      <WikiFooter />
    </div>
  );
}
