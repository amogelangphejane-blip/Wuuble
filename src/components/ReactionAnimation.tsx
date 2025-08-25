import React, { useEffect, useState } from 'react';
import { Heart, Flame } from 'lucide-react';

interface ReactionAnimationProps {
  reactions: Array<{
    id: string;
    type: 'love' | 'laugh' | 'clap' | 'fire' | 'like' | 'wow';
    x: number;
    y: number;
    timestamp: number;
  }>;
  className?: string;
}

interface AnimatedReaction {
  id: string;
  type: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  translateY: number;
}

export const ReactionAnimation: React.FC<ReactionAnimationProps> = ({
  reactions,
  className = ''
}) => {
  const [animatedReactions, setAnimatedReactions] = useState<AnimatedReaction[]>([]);

  useEffect(() => {
    reactions.forEach((reaction) => {
      // Check if reaction already exists
      const exists = animatedReactions.some(ar => ar.id === reaction.id);
      if (exists) return;

      // Add new reaction
      const newReaction: AnimatedReaction = {
        id: reaction.id,
        type: reaction.type,
        x: reaction.x,
        y: reaction.y,
        opacity: 1,
        scale: 0.5,
        translateY: 0
      };

      setAnimatedReactions(prev => [...prev, newReaction]);

      // Animate the reaction
      const animationSteps = [
        // Scale up and fade in
        { scale: 1.2, opacity: 1, translateY: -20 },
        // Scale to normal and move up
        { scale: 1, opacity: 0.8, translateY: -60 },
        // Fade out and continue moving up
        { scale: 0.8, opacity: 0, translateY: -100 }
      ];

      let stepIndex = 0;
      const animate = () => {
        if (stepIndex >= animationSteps.length) {
          // Remove reaction after animation
          setAnimatedReactions(prev => prev.filter(ar => ar.id !== reaction.id));
          return;
        }

        const step = animationSteps[stepIndex];
        setAnimatedReactions(prev => 
          prev.map(ar => 
            ar.id === reaction.id 
              ? { ...ar, ...step }
              : ar
          )
        );

        stepIndex++;
        setTimeout(animate, 300);
      };

      // Start animation after a brief delay
      setTimeout(animate, 50);
    });
  }, [reactions]);

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'love':
        return <Heart className="w-8 h-8 text-red-500 fill-current" />;
      case 'fire':
        return <Flame className="w-8 h-8 text-orange-500 fill-current" />;
      case 'laugh':
        return <span className="text-3xl">😂</span>;
      case 'clap':
        return <span className="text-3xl">👏</span>;
      case 'like':
        return <span className="text-3xl">👍</span>;
      case 'wow':
        return <span className="text-3xl">😮</span>;
      default:
        return <span className="text-3xl">❤️</span>;
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {animatedReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute transition-all duration-300 ease-out"
          style={{
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            opacity: reaction.opacity,
            transform: `scale(${reaction.scale}) translateY(${reaction.translateY}px)`,
            zIndex: 1000
          }}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full shadow-lg">
            {getReactionIcon(reaction.type)}
          </div>
        </div>
      ))}
    </div>
  );
};