/*
 * BottomNav — Cyber Noir Casino theme
 * Bottom navigation bar for the poker app
 */
import { useLocation, Link } from 'wouter';
import { Home, Trophy, User, Wallet, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/lobby', label: 'Lobby', icon: Home },
  { path: '/tournaments', label: 'Tourneys', icon: Trophy },
  { path: '/cashier', label: 'Cashier', icon: Wallet },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/more', label: 'More', icon: MoreHorizontal },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-gold/15">
      <div className="flex items-center justify-around py-2 pb-5">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-gold' : 'text-gray-500 hover:text-gray-300'
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
