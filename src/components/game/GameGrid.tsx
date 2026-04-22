import { useState, memo, useCallback } from 'react';
import { useGame, TileState } from '@/lib/gameContext';
import { TEAM_COLORS } from '@/lib/gameState';

const Tile = memo(function Tile({
  tile,
  tileState,
  onClick,
  justClaimed,
}: {
  tile: string | null;
  tileState: TileState;
  onClick: () => void;
  justClaimed: boolean;
}) {
  if (tileState === 'blocked') {
    return <div className="grid-tile tile-blocked" />;
  }
  const tileClass = tile
    ? TEAM_COLORS[tile as keyof typeof TEAM_COLORS]
    : tileState === 'bonus'
    ? 'tile-bonus'
    : 'tile-empty';
  return (
    <button
      className={`grid-tile ${tileClass} ${justClaimed ? 'animate-claim' : ''}`}
      onClick={onClick}
    />
  );
});

export function GameGrid() {
  const { currentSession, claimTile, gridSize, tileStates, activeEvent } = useGame();
  const [claimedCell, setClaimedCell] = useState<string | null>(null);

  const handleClick = useCallback((r: number, c: number) => {
    claimTile(r, c);
    const key = `${r}-${c}`;
    setClaimedCell(key);
    setTimeout(() => setClaimedCell(null), 150);
  }, [claimTile]);

  if (!currentSession) return null;
  const { grid } = currentSession;

  return (
    <div className="mx-auto aspect-square w-full max-w-[600px]">
      <div
        className={`grid h-full w-full gap-[1px] rounded-lg p-0.5 ${
          activeEvent?.type === 'network-congestion' ? 'animate-pulse opacity-90' : ''
        }`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          background: 'hsl(240 5% 12%)',
        }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const key = `${r}-${c}`;
            return (
              <Tile
                key={key}
                tile={tile}
                tileState={tileStates[r]?.[c] || 'normal'}
                onClick={() => handleClick(r, c)}
                justClaimed={claimedCell === key}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
