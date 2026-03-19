import { PlayerCombatStats } from '../game/combatSystem';

interface GameHUDProps {
  gameTime: string;
  questCount: number;
  onQuestLogToggle: () => void;
  onInventoryToggle: () => void;
  playerStats?: PlayerCombatStats;
  coins: number;
  currentMap: string;
}

export default function GameHUD({ gameTime, questCount, onQuestLogToggle, onInventoryToggle, playerStats, coins, currentMap }: GameHUDProps) {
  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 p-3 flex justify-between items-start z-40 pointer-events-none">
        {/* Game title */}
        <div className="glass-panel px-3 py-2 pointer-events-auto">
          <h1 className="font-display text-xs font-bold text-primary tracking-tight">
            ЗАГУБЛЕНА В НЕОН-ТОКІО
          </h1>
          <p className="text-muted-foreground text-[10px] font-mono">{gameTime}</p>
        </div>

        {/* Right buttons */}
        <div className="flex gap-2 pointer-events-auto">
          {/* Coins */}
          <div className="glass-panel px-3 py-2">
            <span className="text-xs font-mono text-yellow-400">🪙 {coins}</span>
          </div>

          {/* Inventory */}
          <button
            onClick={onInventoryToggle}
            className="glass-panel px-3 py-2 active:scale-[0.96] transition-transform duration-200"
          >
            <span className="text-sm">🎒</span>
          </button>

          {/* Quest button */}
          <button
            onClick={onQuestLogToggle}
            className="glass-panel px-3 py-2 neon-glow active:scale-[0.96] transition-transform duration-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="font-display text-xs text-foreground">Завдання</span>
              {questCount > 1 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-mono 
                               rounded-full w-4 h-4 flex items-center justify-center">
                  {questCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Player HP bar - always visible */}
      {playerStats && (
        <div className="fixed top-14 left-3 z-40 glass-panel px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">Рів.{playerStats.level}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ❤️ {playerStats.hp}/{playerStats.maxHp}
            </span>
          </div>
          <div className="w-28 bg-muted/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-300"
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
          <p className="text-[9px] text-muted-foreground font-mono">
            ⚔️{playerStats.attack} 🛡️{playerStats.defense}
          </p>
        </div>
      )}

      {/* Hint text */}
      <div className="fixed bottom-20 left-0 right-0 text-center pointer-events-none z-30">
        <p className="text-muted-foreground text-[10px] font-body animate-pulse-neon">
          Натисни на землю щоб іти • Натисни на NPC щоб говорити
        </p>
      </div>
    </>
  );
}
