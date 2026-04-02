import { PlayerCombatStats } from '../game/combatSystem';

interface GameHUDProps {
  questCount: number;
  onQuestLogToggle: () => void;
  onInventoryToggle: () => void;
  playerStats: PlayerCombatStats;
  coins: number;
  currentMap: string;
}

export default function GameHUD({ questCount, onQuestLogToggle, onInventoryToggle, playerStats, coins, currentMap }: GameHUDProps) {
  return (
    <>
      {/* Top bar - right side only */}
      <div className="fixed top-0 right-0 p-2 flex gap-1.5 items-start z-40 pointer-events-auto">
        {/* Coins */}
        <div className="glass-panel px-2 py-1.5">
          <span className="text-[10px] font-mono text-yellow-400">🪙 {coins}</span>
        </div>

        {/* Inventory */}
        <button
          onClick={onInventoryToggle}
          className="glass-panel px-2 py-1.5 active:scale-[0.96] transition-transform duration-200"
        >
          <span className="text-sm">🎒</span>
        </button>

        {/* Quest button */}
        <button
          onClick={onQuestLogToggle}
          className="glass-panel px-2 py-1.5 neon-glow active:scale-[0.96] transition-transform duration-200"
        >
          <div className="flex items-center gap-1">
            <span className="text-sm">📋</span>
            {questCount > 1 && (
              <span className="bg-primary text-primary-foreground text-[9px] font-mono 
                             rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {questCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Player HP bar - always visible, top left, below minimap area */}
      <div className="fixed z-40 glass-panel px-2 py-1.5 space-y-0.5" style={{ top: '8px', left: '8px' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground font-mono">Рів.{playerStats.level}</span>
          <span className="text-[9px] text-muted-foreground font-mono">
            ❤️ {playerStats.hp}/{playerStats.maxHp}
          </span>
        </div>
        <div className="w-24 bg-muted/50 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (playerStats.hp / playerStats.maxHp) * 100)}%`,
              background: playerStats.hp / playerStats.maxHp > 0.5
                ? 'linear-gradient(90deg, hsl(150, 60%, 35%), hsl(150, 60%, 45%))'
                : playerStats.hp / playerStats.maxHp > 0.25
                  ? 'linear-gradient(90deg, hsl(40, 80%, 45%), hsl(40, 80%, 55%))'
                  : 'linear-gradient(90deg, hsl(0, 70%, 40%), hsl(0, 70%, 55%))',
            }}
          />
        </div>
        <p className="text-[8px] text-muted-foreground font-mono">
          ⚔️{playerStats.attack} 🛡️{playerStats.defense}
        </p>
      </div>

      {/* Hint text */}
      <div className="fixed bottom-20 left-0 right-0 text-center pointer-events-none z-30">
        <p className="text-muted-foreground text-[10px] font-body animate-pulse-neon">
          Натисни на землю щоб іти • Натисни на NPC щоб говорити
        </p>
      </div>
    </>
  );
}
