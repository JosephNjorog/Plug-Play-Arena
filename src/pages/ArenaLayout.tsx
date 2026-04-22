import { ArenaProvider } from '@/lib/arenaContext';
import { Outlet } from 'react-router-dom';

export default function ArenaLayout() {
  return (
    <ArenaProvider>
      <Outlet />
    </ArenaProvider>
  );
}