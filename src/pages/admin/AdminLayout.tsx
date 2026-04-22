import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/lib/playerContext';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Calendar, Gamepad2, Zap, Users,
  Radio, FileCheck, Gem, Settings, ChevronRight, LogOut, Shield
} from 'lucide-react';

const NAV = [
  { to: '/admin',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/admin/events',      label: 'Events',       icon: Calendar },
  { to: '/admin/games',       label: 'Games',        icon: Gamepad2 },
  { to: '/admin/challenges',  label: 'Challenges',   icon: Zap },
  { to: '/admin/players',     label: 'Players',      icon: Users },
  { to: '/admin/arena',       label: 'Arena',        icon: Radio },
  { to: '/admin/submissions', label: 'Submissions',  icon: FileCheck },
  { to: '/admin/nfts',        label: 'NFT Mints',    icon: Gem },
  { to: '/admin/settings',    label: 'Settings',     icon: Settings },
];

export default function AdminLayout() {
  const { user } = usePlayer();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    supabase.rpc('is_admin').then(({ data }) => {
      setIsAdmin(!!data);
      if (!data) navigate('/');
    });
  }, [user, navigate]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/auth');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-display text-sm tracking-wider">Admin Panel</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" /> Back to site
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen bg-background">
        <Outlet />
      </main>
    </div>
  );
}
