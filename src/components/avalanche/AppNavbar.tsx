import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePlayer } from '@/lib/playerContext';
import { Button } from '@/components/ui/button';
import { Menu, X, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/library', label: 'Game Library' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/journey', label: 'My Journey' },
];

export function AppNavbar() {
  const { user, profile, signOut } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <span className="text-sm font-black">▲</span>
          </div>
          <span className="font-display text-base tracking-wider">plug<span className="text-primary">n</span>play</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive(item.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user && profile ? (
            <Link to="/profile" className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 sm:flex">
              <span className="text-base">{profile.emoji}</span>
              <span className="font-display tracking-wider">{profile.username}</span>
              <span className="text-muted-foreground">· {profile.xp} XP</span>
            </Link>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-1">
              <LogIn className="h-3 w-3" /> Sign in
            </Button>
          )}
          {user && (
            <Button size="sm" variant="ghost" onClick={() => signOut()} className="hidden sm:inline-flex">Sign out</Button>
          )}
          <button className="md:hidden" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {NAV.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium',
                  isActive(item.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">Profile</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
