import { Persona, PERSONAS } from '@/lib/avalanche';
import { cn } from '@/lib/utils';

interface PersonaSelectorProps {
  selected?: Persona | null;
  onSelect: (persona: Persona) => void;
  layout?: 'grid' | 'pills';
  showAll?: boolean;
}

export function PersonaSelector({ selected, onSelect, layout = 'grid', showAll = false }: PersonaSelectorProps) {
  if (layout === 'pills') {
    return (
      <div className="flex flex-wrap gap-2">
        {showAll && (
          <button
            onClick={() => onSelect(null as unknown as Persona)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              !selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >All</button>
        )}
        {PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              selected === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="mr-1">{p.emoji}</span>{p.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {PERSONAS.map(p => {
        const active = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'group rounded-xl border bg-card p-4 text-left transition-all',
              active ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary))]' : 'border-border hover:border-primary/40'
            )}
          >
            <div className="text-3xl">{p.emoji}</div>
            <div className="mt-3 font-display text-sm tracking-wider">{p.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{p.tagline}</div>
          </button>
        );
      })}
    </div>
  );
}
