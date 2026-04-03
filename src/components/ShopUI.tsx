import { useState } from 'react';
import { ITEM_DEFS, ItemDef, InventoryItem, getItemDef } from '../game/inventorySystem';

export type ShopType = 'all' | 'healing' | 'combat' | 'unusual';

const HEALING_IDS = ['gum', 'tea', 'bear', 'donut', 'cocoa', 'apple', 'plushbear'];
const COMBAT_IDS = ['lollisword', 'wand', 'bubblegun', 'heartbow', 'bathbomb', 'megaphone', 'flash', 'clock', 'hologram', 'spellbook', 'bearhat', 'shinycloak', 'cloak'];
const UNUSUAL_IDS = ['watershoes', 'battery', 'compass', 'magnet', 'discohat', 'glitter', 'luckycoin', 'perfume', 'teleport'];

function getShopItems(type: ShopType): ItemDef[] {
  switch (type) {
    case 'healing': return ITEM_DEFS.filter(i => HEALING_IDS.includes(i.id));
    case 'combat': return ITEM_DEFS.filter(i => COMBAT_IDS.includes(i.id));
    case 'unusual': return ITEM_DEFS.filter(i => UNUSUAL_IDS.includes(i.id));
    default: return ITEM_DEFS;
  }
}

const SHOP_NAMES: Record<ShopType, string> = {
  all: '🏪 Магазин Ханса',
  healing: '🏥 Аптека «Здоров\'я»',
  combat: '🛡️ Поліцейський арсенал',
  unusual: '🏛️ Музей дивовижних речей',
};

interface ShopUIProps {
  coins: number;
  inventory: InventoryItem[];
  onBuy: (itemId: string) => void;
  onClose: () => void;
  shopType: ShopType;
}

export default function ShopUI({ coins, inventory, onBuy, onClose, shopType }: ShopUIProps) {
  const [cart, setCart] = useState<string[]>([]);
  const shopItems = getShopItems(shopType);

  const cartTotal = cart.reduce((sum, id) => sum + (getItemDef(id)?.price || 0), 0);
  const canCheckout = cartTotal > 0 && cartTotal <= coins;

  const addToCart = (itemId: string) => {
    const def = getItemDef(itemId);
    if (!def) return;
    const newTotal = cartTotal + def.price;
    if (newTotal <= coins) setCart(prev => [...prev, itemId]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleOk = () => {
    cart.forEach(id => onBuy(id));
    setCart([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glass-panel p-3 max-w-lg w-full relative neon-glow max-h-[85vh] flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm text-primary font-bold">{SHOP_NAMES[shopType]}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-yellow-400">🪙 {coins}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          </div>
        </div>

        <div className="flex gap-2 flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <p className="text-[9px] text-muted-foreground font-bold mb-1">ТОВАРИ</p>
            {shopItems.map(item => {
              const canAfford = coins - cartTotal >= item.price;
              return (
                <button key={item.id} onClick={() => canAfford && addToCart(item.id)} disabled={!canAfford}
                  className={`w-full p-1.5 rounded-md border text-left transition-all active:scale-[0.98] flex items-center gap-1.5
                    ${canAfford ? 'border-border bg-muted/20 hover:bg-muted/40' : 'border-border/30 bg-muted/10 opacity-40 cursor-not-allowed'}`}>
                  <span className="text-sm flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-[9px] font-bold truncate">{item.name}</p>
                    <p className="text-muted-foreground text-[8px]">{item.description}</p>
                  </div>
                  <span className={`text-[9px] font-mono flex-shrink-0 ${canAfford ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    🪙{item.price}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-36 flex flex-col border-l border-border pl-2">
            <p className="text-[9px] text-muted-foreground font-bold mb-1">КОШИК ({cart.length})</p>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-[60px]">
              {cart.length === 0 ? (
                <p className="text-[8px] text-muted-foreground text-center py-2">Натисни на товар</p>
              ) : cart.map((id, i) => {
                const def = getItemDef(id);
                if (!def) return null;
                return (
                  <div key={i} className="flex items-center gap-1 p-1 rounded bg-primary/10 border border-primary/20">
                    <span className="text-xs">{def.icon}</span>
                    <span className="text-[8px] text-foreground flex-1 truncate">{def.name}</span>
                    <button onClick={() => removeFromCart(i)} className="text-[10px] text-red-400 hover:text-red-300">✕</button>
                  </div>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="text-[9px] font-mono text-yellow-400 text-center py-1 border-t border-border mt-1">
                Разом: 🪙{cartTotal}
              </div>
            )}

            <div className="flex gap-1 mt-1">
              <button onClick={handleOk} disabled={!canCheckout}
                className={`flex-1 p-1.5 rounded text-[10px] font-bold transition-all active:scale-95 ${
                  canCheckout ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400'
                    : 'bg-muted/20 border border-border text-muted-foreground cursor-not-allowed'}`}>
                ✓ Ок
              </button>
              <button onClick={() => setCart([])}
                className="flex-1 p-1.5 rounded text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all active:scale-95">
                ✕ Скасувати
              </button>
            </div>

            <div className="mt-2 border-t border-border pt-1">
              <p className="text-[9px] text-muted-foreground font-bold mb-1">ІНВЕНТАР</p>
              <div className="max-h-24 overflow-y-auto space-y-0.5">
                {inventory.length === 0 ? (
                  <p className="text-[8px] text-muted-foreground text-center">Порожній</p>
                ) : inventory.map(inv => {
                  const def = getItemDef(inv.itemId);
                  if (!def) return null;
                  return (
                    <div key={inv.itemId} className="flex items-center gap-1 text-[8px]">
                      <span>{def.icon}</span>
                      <span className="text-foreground truncate flex-1">{def.name}</span>
                      {inv.quantity > 1 && <span className="text-primary">x{inv.quantity}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
