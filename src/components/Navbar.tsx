import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './game/WalletConnect';

const NAV_LINKS = [
  { to: '/sessions', label: 'Sessions' },
  { to: '/games', label: 'Games' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-lg tracking-wider text-primary neon-text">
            plugn'play
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}
