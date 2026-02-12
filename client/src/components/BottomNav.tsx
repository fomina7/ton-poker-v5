/**
 * BottomNav — HOUSE POKER Premium Club
 * Sleek bottom navigation with gold accents
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
    <nav className="fixed bottom-0 left-0 right-0 z-40" style={{
      background: 'rgba(6, 6, 10, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(212, 175, 55, 0.06)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div className="flex items-center justify-around py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 ${
                isActive ? 'text-gold' : 'text-gray-600 hover:text-gray-400 active:scale-95'
              }`}>
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-medium tracking-wider">{item.label}</span>
                {isActive && (
                  <div className="w-3 h-0.5 rounded-full mt-0.5" style={{
                    background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                  }} />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
