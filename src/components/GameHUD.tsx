interface GameHUDProps {
  gameTime: string;
  questCount: number;
  onQuestLogToggle: () => void;
}

export default function GameHUD({ gameTime, questCount, onQuestLogToggle }: GameHUDProps) {
  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 p-3 flex justify-between items-start z-40 pointer-events-none">
        {/* Game title */}
        <div className="glass-panel px-3 py-2 pointer-events-auto">
          <h1 className="font-display text-xs font-bold text-primary tracking-tight">
            LOST IN NEON-TOKYO
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
            <span className="font-display text-xs text-foreground">Квесты</span>
            {questCount > 1 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-mono 
                             rounded-full w-4 h-4 flex items-center justify-center">
                {questCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Hint text */}
      <div className="fixed bottom-20 left-0 right-0 text-center pointer-events-none z-30">
        <p className="text-muted-foreground text-[10px] font-body animate-pulse-neon">
          Нажми на землю чтобы идти • Нажми на NPC чтобы говорить
        </p>
      </div>
    </>
  );
}
