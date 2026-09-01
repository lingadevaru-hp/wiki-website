import WikiLayout from "../components/WikiLayout";
import { Link } from "wouter";

export default function NotFoundPage() {
  return (
    <WikiLayout footer>
      <h1 className="text-[1.95em] font-serif font-normal mb-4">
        Page not found
      </h1>
      <hr className="border-border mb-4" />
      <p className="text-sm mb-3">
        The page you requested does not exist in Thoshan&apos;s Wiki.
      </p>
      <p className="text-sm mb-3">You may want to:</p>
      <ul className="list-disc list-inside text-sm space-y-1 mb-4">
        <li>
          <Link href="/wiki/home" className="text-accent hover:underline">
            Return to Wiki Home
          </Link>
        </li>
        <li>
          <Link href="/wiki/about" className="text-accent hover:underline">
            Read about Thoshan
          </Link>
        </li>
        <li>
          <Link href="/wiki/search" className="text-accent hover:underline">
            Search for articles
          </Link>
        </li>
      </ul>
    </WikiLayout>
  );
}
