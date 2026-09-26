import WikiLayout from "../components/WikiLayout";
import { Link } from "wouter";
import SEO from "../components/SEO";
import { useLocale } from "../contexts/LocaleContext";

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <WikiLayout showBackTop>
      <SEO
        title="Page Not Found — Lingadevaru HP's Wiki"
        description="The page you requested does not exist in Lingadevaru HP's Wiki."
        path="/404"
      />
      <div className="empty-page">
        <p className="section-eyebrow">404</p>
        <h1 className="text-[1.95em] font-serif font-normal mb-4">
          {t('notfound.title')}
        </h1>
        <hr className="border-border mb-4 w-full max-w-[300px]" />
        <p className="text-sm mb-3 text-muted-foreground">
          The page you requested does not exist in Lingadevaru HP&apos;s Wiki.
        </p>
        <p className="text-sm mb-4 text-muted-foreground">{t('notfound.suggest')}</p>
        <ul className="list-disc list-inside text-sm space-y-2 mb-4">
          <li>
            <Link href="/wiki/home" className="text-accent hover:underline">
              Return to Wiki Home
            </Link>
          </li>
          <li>
            <Link href="/wiki/about" className="text-accent hover:underline">
              Read about Lingadevaru HP
            </Link>
          </li>
          <li>
            <Link href="/wiki/search" className="text-accent hover:underline">
              Search for articles
            </Link>
          </li>
        </ul>
      </div>
    </WikiLayout>
  );
}
