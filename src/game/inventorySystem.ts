import { Position } from './types';

export type ItemEffect =
  | { type: 'heal'; amount: number }
  | { type: 'fullHeal' }
  | { type: 'overheal'; amount: number }
  | { type: 'invisibility'; duration: number; reusable: boolean }
  | { type: 'waterWalk' }
  | { type: 'damageReduction'; amount: number }
  | { type: 'bombAoe' }
  | { type: 'projectile' }
  | { type: 'knockback' }
  | { type: 'slowEnemies'; duration: number }
  | { type: 'meleeWeapon' }
  | { type: 'freezeProjectile' }
  | { type: 'speedBoost' }
  | { type: 'compass' }
  | { type: 'flashFreeze'; duration: number }
  | { type: 'timeStop'; duration: number }
  | { type: 'teleportRandom' }
  | { type: 'coinMagnet' }
  | { type: 'discoLight' }
  | { type: 'glitterTrail' }
  | { type: 'hologram' }
  | { type: 'luckyDrop' }
  | { type: 'chickenTransform' }
  | { type: 'shinyDrop' };

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
  effect: ItemEffect;
  consumable: boolean; // used once and removed
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface ActiveEffect {
  type: string;
  endsAt: number; // timestamp
}

// All 29 items
export const ITEM_DEFS: ItemDef[] = [
  { id: 'gum', name: 'Жуйка «Бульбашка удачі»', icon: '🫧', description: '+5 HP', price: 3, effect: { type: 'heal', amount: 5 }, consumable: true },
  { id: 'tea', name: 'Бабл-ті «Космічна чорниця»', icon: '🧋', description: '+15 HP', price: 5, effect: { type: 'heal', amount: 15 }, consumable: true },
  { id: 'bear', name: 'Мармеладне ведмежа', icon: '🧸', description: '+25 HP', price: 8, effect: { type: 'heal', amount: 25 }, consumable: true },
  { id: 'donut', name: 'Магічний пончик', icon: '🍩', description: '+10 HP', price: 4, effect: { type: 'heal', amount: 10 }, consumable: true },
  { id: 'cocoa', name: 'Чарівне какао', icon: '☕', description: '+20 HP', price: 7, effect: { type: 'heal', amount: 20 }, consumable: true },
  { id: 'apple', name: 'Золоте яблуко', icon: '🍎', description: 'HP на максимум', price: 15, effect: { type: 'fullHeal' }, consumable: true },
  { id: 'perfume', name: 'Парфуми «Запах тіні»', icon: '🌸', description: 'Невидимість 10с (одноразово)', price: 6, effect: { type: 'invisibility', duration: 10000, reusable: false }, consumable: true },
  { id: 'cloak', name: 'Плащ-невидимка', icon: '🧥', description: 'Невидимість 10с (багаторазово)', price: 18, effect: { type: 'invisibility', duration: 10000, reusable: true }, consumable: false },
  { id: 'watershoes', name: 'Водні кросівки', icon: '👟', description: 'Ходити по воді', price: 12, effect: { type: 'waterWalk' }, consumable: false },
  { id: 'bearhat', name: 'Шапка-ведмідь', icon: '🐻', description: '-2 до будь-якої шкоди', price: 10, effect: { type: 'damageReduction', amount: 2 }, consumable: false },
  { id: 'bathbomb', name: 'Бомбочка для ванни', icon: '💣', description: 'Знищує ворогів навколо', price: 5, effect: { type: 'bombAoe' }, consumable: true },
  { id: 'wand', name: 'Магічна паличка', icon: '🪄', description: 'Стріляє кулею', price: 16, effect: { type: 'projectile' }, consumable: false },
  { id: 'megaphone', name: 'Мегафон', icon: '📢', description: 'Відкидає ворогів', price: 8, effect: { type: 'knockback' }, consumable: true },
  { id: 'heartbow', name: 'Лук із сердечками', icon: '🏹', description: 'Сповільнює ворогів', price: 12, effect: { type: 'slowEnemies', duration: 5000 }, consumable: false },
  { id: 'lollisword', name: 'Меч-льодяник', icon: '🗡️', description: 'Ближній бій', price: 10, effect: { type: 'meleeWeapon' }, consumable: false },
  { id: 'bubblegun', name: 'Бульбашкова гармата', icon: '🔫', description: 'Заморожує ворога', price: 9, effect: { type: 'freezeProjectile' }, consumable: false },
  { id: 'battery', name: 'Супер-батарейка', icon: '🔋', description: 'Збільшує швидкість', price: 10, effect: { type: 'speedBoost' }, consumable: false },
  { id: 'compass', name: 'Компас «Слід»', icon: '🧭', description: 'Показує шлях до виходу', price: 5, effect: { type: 'compass' }, consumable: false },
  { id: 'flash', name: 'Фото-спалах', icon: '📸', description: 'Зупиняє ворогів на 10с', price: 8, effect: { type: 'flashFreeze', duration: 10000 }, consumable: true },
  { id: 'clock', name: 'Годинник заморозки', icon: '⏰', description: 'Зупинка часу на 15с', price: 16, effect: { type: 'timeStop', duration: 15000 }, consumable: true },
  { id: 'teleport', name: 'Кишеньковий телепорт', icon: '🌀', description: 'Телепорт у безпечне місце', price: 6, effect: { type: 'teleportRandom' }, consumable: true },
  { id: 'magnet', name: 'Магніт для монет', icon: '🧲', description: 'Збільшує радіус підбору', price: 12, effect: { type: 'coinMagnet' }, consumable: false },
  { id: 'discohat', name: 'Капелюх-дискокуля', icon: '🪩', description: 'Коло світла навколо', price: 6, effect: { type: 'discoLight' }, consumable: false },
  { id: 'glitter', name: 'Пакет із блискітками', icon: '✨', description: 'Залишає слід', price: 3, effect: { type: 'glitterTrail' }, consumable: false },
  { id: 'hologram', name: 'Голограма', icon: '👤', description: 'Відволікає ворогів', price: 9, effect: { type: 'hologram' }, consumable: true },
  { id: 'luckycoin', name: 'Щаслива монета', icon: '🪙', description: 'x2 монети з ворогів', price: 14, effect: { type: 'luckyDrop' }, consumable: false },
  { id: 'spellbook', name: 'Книга заклинань', icon: '📖', description: 'Перетворює монстра на курку', price: 12, effect: { type: 'chickenTransform' }, consumable: true },
  { id: 'plushbear', name: 'Плюшевий ведмедик', icon: '🧸', description: 'Тимчасові +20 HP', price: 22, effect: { type: 'overheal', amount: 20 }, consumable: true },
  { id: 'shinycloak', name: 'Блискуча накидка', icon: '🌟', description: '+30% шанс на дроп', price: 14, effect: { type: 'shinyDrop' }, consumable: false },
];

export function getItemDef(id: string): ItemDef | undefined {
  return ITEM_DEFS.find(i => i.id === id);
}

// Shop items - what Hans sells (all items)
export const SHOP_ITEMS = ITEM_DEFS.map(i => i.id);

// Generate random loot from monster kill
export function generateMonsterLoot(hasLuckyCoin: boolean, hasShinyCloak: boolean): { coins: number; itemId?: string } {
  const coins = Math.floor(Math.random() * 10) + 1;
  const finalCoins = hasLuckyCoin ? coins * 2 : coins;
  
  const dropChance = hasShinyCloak ? 0.4 : 0.1;
  let itemId: string | undefined;
  
  if (Math.random() < dropChance) {
    // Drop a random consumable item
    const droppable = ITEM_DEFS.filter(i => i.consumable && i.price <= 10);
    if (droppable.length > 0) {
      itemId = droppable[Math.floor(Math.random() * droppable.length)].id;
    }
  }
  
  return { coins: finalCoins, itemId };
}

// Coin positions
export interface Coin {
  id: string;
  pos: Position;
  collected: boolean;
  map: 'city' | 'dungeon';
}

export function generateCityCoins(): Coin[] {
  // 3 coins in accessible city locations (roads/sidewalks)
  return [
    { id: 'city_0', pos: { x: 10, y: 3 }, collected: false, map: 'city' },
    { id: 'city_1', pos: { x: 25, y: 15 }, collected: false, map: 'city' },
    { id: 'city_2', pos: { x: 5, y: 25 }, collected: false, map: 'city' },
  ];
}

export function generateDungeonCoins(
  dungeonTilesData: number[][],
  width: number,
  height: number,
  walkableCheck: (tile: number | undefined) => boolean
): Coin[] {
  
  const candidates: Position[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < 4 && y < 4) continue;
      if (walkableCheck(dungeonTilesData[y]?.[x])) {
        candidates.push({ x, y });
      }
    }
  }
  
  // Seeded shuffle
  let seed = 54321;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  
  const spacing = Math.floor(candidates.length / 60);
  const coins: Coin[] = [];
  for (let i = 0; i < 60 && i * spacing < candidates.length; i++) {
    coins.push({
      id: `dun_${i}`,
      pos: candidates[i * spacing],
      collected: false,
      map: 'dungeon',
    });
  }
  
  return coins;
}
