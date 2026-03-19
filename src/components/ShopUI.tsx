import { ITEM_DEFS, ItemDef } from '../game/inventorySystem';

interface ShopUIProps {
  coins: number;
  onBuy: (itemId: string) => void;
  onClose: () => void;
}

export default function ShopUI({ coins, onBuy, onClose }: ShopUIProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glass-panel p-4 max-w-sm w-full relative neon-glow max-h-[80vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-primary font-bold">🏪 Магазин Ханса</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-yellow-400">🪙 {coins}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          </div>
        </div>

        <div className="space-y-1.5">
          {ITEM_DEFS.map(item => {
            const canAfford = coins >= item.price;
            return (
              <button
                key={item.id}
                onClick={() => canAfford && onBuy(item.id)}
                disabled={!canAfford}
                className={`w-full p-2 rounded-md border text-left transition-all active:scale-[0.98] flex items-center gap-2
                  ${canAfford
                    ? 'border-border bg-muted/20 hover:bg-muted/40'
                    : 'border-border/30 bg-muted/10 opacity-40 cursor-not-allowed'
                  }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-[10px] font-bold truncate">{item.name}</p>
                  <p className="text-muted-foreground text-[9px]">{item.description}</p>
                </div>
                <span className={`text-[10px] font-mono flex-shrink-0 ${canAfford ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  🪙{item.price}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
