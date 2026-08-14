import { useLocation, Link } from 'wouter';
import { Home, Search, User, Grid3X3 } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';

export default function BottomNavBar() {
  const [location] = useLocation();
  const { openSearch } = useSearch();

  const isActive = (path: string) => location === path;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#161C24] border-t border-[#2A3040] z-50">
      <div className="flex justify-around items-center py-1 px-2 safe-area-inset-bottom">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
            isActive('/') ? 'text-[#3366CC] bg-[#1E2A3A]' : 'text-[#7A8494] hover:text-[#A0AABC]'
          }`}
          aria-label="Home"
        >
          <Home size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link
          href="/wiki/home"
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
            isActive('/wiki/home') ? 'text-[#3366CC] bg-[#1E2A3A]' : 'text-[#7A8494] hover:text-[#A0AABC]'
          }`}
          aria-label="Wiki"
        >
          <Grid3X3 size={22} />
          <span className="text-[10px] font-medium">Wiki</span>
        </Link>
        
        <button
          onClick={openSearch}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
            location.includes('/wiki/search') ? 'text-[#3366CC] bg-[#1E2A3A]' : 'text-[#7A8494] hover:text-[#A0AABC]'
          }`}
          aria-label="Search"
        >
          <Search size={22} />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        
        <Link
          href="/wiki/about"
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
            isActive('/wiki/about') ? 'text-[#3366CC] bg-[#1E2A3A]' : 'text-[#7A8494] hover:text-[#A0AABC]'
          }`}
          aria-label="Profile"
        >
          <User size={22} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
