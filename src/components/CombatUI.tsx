import { useState, useCallback } from 'react';
import { Monster, PlayerCombatStats, CombatState, performAttack, getXpForLevel } from '../game/combatSystem';

interface CombatUIProps {
  combat: CombatState;
  playerStats: PlayerCombatStats;
  onAttack: () => void;
  onDefend: () => void;
  onFlee: () => void;
  onEnd: () => void;
}

export default function CombatUI({ combat, playerStats, onAttack, onDefend, onFlee, onEnd }: CombatUIProps) {
  if (!combat.active || !combat.monster) return null;

  const monster = combat.monster;
  const playerHpPct = (playerStats.hp / playerStats.maxHp) * 100;
  const monsterHpPct = (monster.hp / monster.maxHp) * 100;
  const xpNeeded = getXpForLevel(playerStats.level);
  const isOver = combat.result !== 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-panel p-4 max-w-sm w-full neon-glow space-y-4">
        {/* Title */}
        <div className="text-center">
          <h2 className="font-display text-primary text-sm font-bold">⚔️ БОЙ!</h2>
        </div>

        {/* Monster info */}
        <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-border">
          <span className="text-3xl">{monster.icon}</span>
          <div className="flex-1">
            <p className="text-foreground text-xs font-bold">{monster.name}</p>
            <div className="w-full bg-muted/50 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, monsterHpPct)}%`,
                  backgroundColor: monsterHpPct > 50 ? 'hsl(0, 70%, 50%)' : monsterHpPct > 25 ? 'hsl(30, 80%, 50%)' : 'hsl(0, 90%, 40%)',
                }}
              />
            </div>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              HP: {Math.max(0, monster.hp)}/{monster.maxHp} | ATK: {monster.attack} | DEF: {monster.defense}
            </p>
          </div>
        </div>

        {/* Player info */}
        <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-primary/30">
          <span className="text-2xl">🎀</span>
          <div className="flex-1">
            <p className="text-foreground text-xs font-bold">Куроми (Ур. {playerStats.level})</p>
            <div className="w-full bg-muted/50 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, playerHpPct)}%`,
                  backgroundColor: playerHpPct > 50 ? 'hsl(150, 70%, 40%)' : playerHpPct > 25 ? 'hsl(40, 80%, 50%)' : 'hsl(0, 90%, 40%)',
                }}
              />
            </div>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              HP: {Math.max(0, playerStats.hp)}/{playerStats.maxHp} | ATK: {playerStats.attack} | DEF: {playerStats.defense} | XP: {playerStats.xp}/{xpNeeded}
            </p>
          </div>
        </div>

        {/* Combat log */}
        <div className="bg-muted/20 rounded-md p-2 h-20 overflow-y-auto border border-border">
          {combat.log.map((msg, i) => (
            <p key={i} className="text-[10px] text-muted-foreground leading-tight">
              {msg}
            </p>
          ))}
        </div>

        {/* Actions */}
        {!isOver && combat.playerTurn ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onAttack}
              className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/40 border border-red-500/40
                         text-foreground text-xs font-bold transition-all active:scale-95"
            >
              ⚔️ Атака
            </button>
            <button
              onClick={onDefend}
              className="p-2 rounded-md bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/40
                         text-foreground text-xs font-bold transition-all active:scale-95"
            >
              🛡️ Защита
            </button>
            <button
              onClick={onFlee}
              className="p-2 rounded-md bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/40
                         text-foreground text-xs font-bold transition-all active:scale-95"
            >
              🏃 Бежать
            </button>
          </div>
        ) : !isOver ? (
          <div className="text-center">
            <p className="text-muted-foreground text-xs animate-pulse">Ход противника...</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className={`text-sm font-bold font-display ${
              combat.result === 'win' ? 'text-green-400' : combat.result === 'fled' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {combat.result === 'win' && `🎉 Победа! +${monster.xpReward} XP`}
              {combat.result === 'lose' && '💀 Поражение...'}
              {combat.result === 'fled' && '🏃 Удалось сбежать!'}
            </p>
            <button
              onClick={onEnd}
              className="w-full p-2 rounded-md bg-primary/20 hover:bg-primary/30
                         border border-primary/30 text-primary text-xs font-display
                         transition-all active:scale-95"
            >
              Продолжить →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
