import { InventoryItem, getItemDef, ITEM_DEFS } from '../game/inventorySystem';

interface InventoryUIProps {
  items: InventoryItem[];
  coins: number;
  onUse: (itemId: string) => void;
  onClose: () => void;
}

export default function InventoryUI({ items, coins, onUse, onClose }: InventoryUIProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glass-panel p-4 max-w-sm w-full relative neon-glow max-h-[75vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-primary font-bold">🎒 Інвентар</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-yellow-400">🪙 {coins}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-4">Інвентар порожній</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map(inv => {
              const def = getItemDef(inv.itemId);
              if (!def) return null;
              return (
                <button
                  key={inv.itemId}
                  onClick={() => onUse(inv.itemId)}
                  className="p-2 rounded-md border border-border bg-muted/20 hover:bg-muted/40
                             transition-all active:scale-95 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{def.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-[10px] font-bold truncate">{def.name}</p>
                      <p className="text-muted-foreground text-[9px]">{def.description}</p>
                    </div>
                    {inv.quantity > 1 && (
                      <span className="text-[10px] font-mono text-primary bg-primary/20 rounded-full w-5 h-5 flex items-center justify-center">
                        {inv.quantity}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
