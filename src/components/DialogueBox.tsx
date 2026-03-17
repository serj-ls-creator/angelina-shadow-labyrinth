import { useState, useEffect } from 'react';
import { DialogueNode } from '../game/types';

interface DialogueBoxProps {
  dialogue: DialogueNode;
  npcName: string;
  npcIcon: string;
  onResponse: (nextId: string) => void;
  onEnd: () => void;
}

export default function DialogueBox({ dialogue, npcName, npcIcon, onResponse, onEnd }: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < dialogue.text.length) {
        setDisplayedText(dialogue.text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [dialogue]);

  const handleSkip = () => {
    if (isTyping) {
      setDisplayedText(dialogue.text);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 pb-6 z-50" onClick={handleSkip}>
      <div className="glass-panel p-4 max-w-lg mx-auto neon-glow">
        {/* Speaker */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{npcIcon}</span>
          <span className="font-display text-primary text-sm font-bold tracking-tight">
            {npcName}
          </span>
        </div>

        {/* Text */}
        <p className="text-foreground text-sm leading-relaxed mb-4 min-h-[3rem]">
          {displayedText}
          {isTyping && <span className="animate-pulse-neon text-primary">▌</span>}
        </p>

        {/* Responses */}
        {!isTyping && dialogue.responses && dialogue.responses.length > 0 && (
          <div className="space-y-2">
            {dialogue.responses.map((resp, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onResponse(resp.nextId);
                }}
                className="w-full text-left p-3 rounded-md bg-muted/50 hover:bg-primary/20 
                           border border-border hover:border-primary/50 text-foreground text-xs
                           transition-all duration-200 active:scale-[0.97]"
              >
                <span className="text-primary mr-2 font-mono text-xs">{idx + 1}.</span>
                {resp.text}
              </button>
            ))}
          </div>
        )}

        {/* End dialogue */}
        {!isTyping && (!dialogue.responses || dialogue.responses.length === 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnd();
            }}
            className="w-full text-center p-3 rounded-md bg-primary/20 hover:bg-primary/30
                       border border-primary/30 text-primary text-xs font-display
                       transition-all duration-200 active:scale-[0.97]"
          >
            Продовжити →
          </button>
        )}
      </div>
    </div>
  );
}
