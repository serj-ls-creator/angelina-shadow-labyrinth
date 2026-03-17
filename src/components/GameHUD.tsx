import { PlayerCombatStats } from '../game/combatSystem';

interface GameHUDProps {
  gameTime: string;
  questCount: number;
  onQuestLogToggle: () => void;
  playerStats?: PlayerCombatStats;
}

export default function GameHUD({ gameTime, questCount, onQuestLogToggle, playerStats }: GameHUDProps) {
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

        {/* Quest button */}
        <button
          onClick={onQuestLogToggle}
          className="glass-panel px-3 py-2 pointer-events-auto neon-glow
                     active:scale-[0.96] transition-transform duration-200"
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

      {/* Player stats bar (dungeon only) */}
      {playerStats && (
        <div className="fixed top-14 left-3 z-40 glass-panel px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">Рів.{playerStats.level}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ❤️ {playerStats.hp}/{playerStats.maxHp}
            </span>
          </div>
          <div className="w-24 bg-muted/50 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${(playerStats.hp / playerStats.maxHp) * 100}%`,
                backgroundColor: playerStats.hp / playerStats.maxHp > 0.5 ? 'hsl(150, 60%, 40%)' : 'hsl(0, 70%, 50%)',
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
