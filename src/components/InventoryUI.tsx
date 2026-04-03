import { Dispatch, SetStateAction } from 'react';
import { InventoryItem, getItemDef, ItemDef } from '../game/inventorySystem';
import { PlayerCombatStats } from '../game/combatSystem';

// Equipment slot types
export type SlotType = 'weapon' | 'armor' | 'accessory' | 'shoes';

const SLOT_INFO: { type: SlotType; label: string; icon: string }[] = [
  { type: 'weapon', label: 'Зброя', icon: '⚔️' },
  { type: 'armor', label: 'Броня', icon: '🛡️' },
  { type: 'accessory', label: 'Аксесуар', icon: '💍' },
  { type: 'shoes', label: 'Взуття', icon: '👟' },
];

const SLOT_ITEMS: Record<SlotType, string[]> = {
  weapon: ['lollisword', 'wand', 'bubblegun', 'heartbow'],
  armor: ['cloak', 'shinycloak', 'bearhat'],
  accessory: ['magnet', 'luckycoin', 'compass', 'discohat', 'glitter'],
  shoes: ['watershoes', 'battery'],
};

function getSlotForItem(itemId: string): SlotType | null {
  for (const [slot, ids] of Object.entries(SLOT_ITEMS)) {
    if (ids.includes(itemId)) return slot as SlotType;
  }
  return null;
}

function isUsableItem(def: ItemDef): boolean {
  const t = def.effect.type;
  return t === 'heal' || t === 'fullHeal' || t === 'overheal' || t === 'bombAoe' || 
         t === 'knockback' || t === 'flashFreeze' || t === 'timeStop' || 
         t === 'teleportRandom' || t === 'invisibility';
}

interface InventoryUIProps {
  items: InventoryItem[];
  coins: number;
  playerStats: PlayerCombatStats;
  onUse: (itemId: string) => void;
  onClose: () => void;
  characterImg: HTMLImageElement | null;
  equipped: Record<SlotType, string | null>;
  onEquipChange: Dispatch<SetStateAction<Record<SlotType, string | null>>>;
}

export default function InventoryUI({ items, coins, playerStats, onUse, onClose, characterImg, equipped, onEquipChange }: InventoryUIProps) {
  const toggleEquip = (itemId: string) => {
    const slot = getSlotForItem(itemId);
    if (!slot) return;
    onEquipChange(prev => ({
      ...prev,
      [slot]: prev[slot] === itemId ? null : itemId,
    }));
  };

  const equippedIds = new Set(Object.values(equipped).filter(Boolean));

  const equippableItems = items.filter(i => getSlotForItem(i.itemId) !== null);
  const usableItems = items.filter(i => {
    const def = getItemDef(i.itemId);
    return def && isUsableItem(def) && !getSlotForItem(i.itemId);
  });
  const passiveItems = items.filter(i => {
    const def = getItemDef(i.itemId);
    return def && !isUsableItem(def) && !getSlotForItem(i.itemId);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glass-panel p-3 max-w-md w-full relative neon-glow max-h-[85vh] flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm text-primary font-bold">🎒 Інвентар</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-yellow-400">🪙 {coins}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          </div>
        </div>

        <div className="flex gap-2 flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-1">
            {usableItems.length > 0 && (
              <>
                <p className="text-[9px] text-green-400 font-bold mb-1">🧪 ВИКОРИСТАТИ</p>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {usableItems.map(inv => {
                    const def = getItemDef(inv.itemId);
                    if (!def) return null;
                    return (
                      <button key={inv.itemId} onClick={() => onUse(inv.itemId)}
                        className="p-1.5 rounded-md border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-all active:scale-95 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{def.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-[9px] font-bold truncate">{def.name}</p>
                            <p className="text-muted-foreground text-[8px]">{def.description}</p>
                          </div>
                          {inv.quantity > 1 && (
                            <span className="text-[9px] font-mono text-primary bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center">
                              {inv.quantity}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {equippableItems.length > 0 && (
              <>
                <p className="text-[9px] text-blue-400 font-bold mb-1">⚔️ СПОРЯДЖЕННЯ</p>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {equippableItems.map(inv => {
                    const def = getItemDef(inv.itemId);
                    if (!def) return null;
                    const isEquipped = equippedIds.has(inv.itemId);
                    return (
                      <button key={inv.itemId} onClick={() => toggleEquip(inv.itemId)}
                        className={`p-1.5 rounded-md border transition-all active:scale-95 text-left ${
                          isEquipped ? 'border-primary/60 bg-primary/20' : 'border-border bg-muted/20 hover:bg-muted/40'
                        }`}>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{def.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-[9px] font-bold truncate">{def.name}</p>
                            <p className="text-muted-foreground text-[8px]">{def.description}</p>
                          </div>
                          {isEquipped && <span className="text-[8px] text-primary">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {passiveItems.length > 0 && (
              <>
                <p className="text-[9px] text-purple-400 font-bold mb-1">✨ ПАСИВНІ</p>
                <div className="grid grid-cols-2 gap-1">
                  {passiveItems.map(inv => {
                    const def = getItemDef(inv.itemId);
                    if (!def) return null;
                    return (
                      <div key={inv.itemId} className="p-1.5 rounded-md border border-border bg-muted/10">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{def.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-[9px] font-bold truncate">{def.name}</p>
                            <p className="text-muted-foreground text-[8px]">{def.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {items.length === 0 && (
              <p className="text-muted-foreground text-xs text-center py-6">Інвентар порожній</p>
            )}
          </div>

          <div className="w-28 flex flex-col items-center border-l border-border pl-2">
            <div className="w-20 h-24 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-center mb-2 relative overflow-hidden">
              {characterImg && characterImg.complete ? (
                <img src={characterImg.src} alt="Персонаж" className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-3xl">🎀</span>
              )}
            </div>

            <div className="w-full text-[8px] text-muted-foreground space-y-0.5 mb-2">
              <div className="flex justify-between"><span>❤️ HP</span><span className="text-foreground">{playerStats.hp}/{playerStats.maxHp}</span></div>
              <div className="flex justify-between"><span>⚔️ АТК</span><span className="text-foreground">{playerStats.attack}</span></div>
              <div className="flex justify-between"><span>🛡️ ЗАХ</span><span className="text-foreground">{playerStats.defense}</span></div>
              <div className="flex justify-between"><span>⭐ Рів.</span><span className="text-foreground">{playerStats.level}</span></div>
            </div>

            <div className="w-full space-y-1">
              {SLOT_INFO.map(slot => {
                const eqId = equipped[slot.type];
                const def = eqId ? getItemDef(eqId) : null;
                return (
                  <div key={slot.type}
                    className={`p-1 rounded border text-[8px] flex items-center gap-1 ${
                      def ? 'border-primary/40 bg-primary/10' : 'border-border/50 bg-muted/10'
                    }`}>
                    <span className="text-xs">{def ? def.icon : slot.icon}</span>
                    <span className={def ? 'text-foreground truncate' : 'text-muted-foreground truncate'}>
                      {def ? def.name : slot.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
