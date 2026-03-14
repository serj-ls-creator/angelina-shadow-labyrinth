import { QuestEntry } from '../game/types';

interface QuestLogProps {
  entries: QuestEntry[];
  onClose: () => void;
}

export default function QuestLog({ entries, onClose }: QuestLogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glass-panel p-5 max-w-sm w-full relative neon-glow max-h-[70vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-primary font-bold">📋 Журнал</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className={`p-3 rounded-md border ${
              entry.completed 
                ? 'border-muted bg-muted/20 opacity-60' 
                : 'border-primary/30 bg-primary/5'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-xs font-bold text-foreground">
                  {entry.completed ? '✅' : '🔍'} {entry.title}
                </span>
                <span className="text-muted-foreground text-[10px] font-mono">{entry.timestamp}</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{entry.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
