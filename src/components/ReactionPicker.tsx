import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus } from 'lucide-react';

export type ReactionType = 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'thumbsup';

export interface ReactionCounts {
  [key in ReactionType]?: number;
}

interface ReactionPickerProps {
  postId: string;
  currentUserReaction?: ReactionType | null;
  reactionCounts: ReactionCounts;
  onReactionChange: (reaction: ReactionType | null, counts: ReactionCounts) => void;
  disabled?: boolean;
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-500' },
  love: { emoji: '❤️', label: 'Love', color: 'text-red-500' },
  laugh: { emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  thumbsup: { emoji: '👏', label: 'Applause', color: 'text-green-500' },
  angry: { emoji: '😠', label: 'Angry', color: 'text-orange-500' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-purple-500' },
};

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  postId,
  currentUserReaction,
  reactionCounts,
  onReactionChange,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<ReactionType | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleReactionClick = async (reactionType: ReactionType) => {
    if (!user || disabled) return;

    try {
      setAnimatingReaction(reactionType);

      if (currentUserReaction === reactionType) {
        // Remove the reaction
        const { error } = await supabase
          .from('community_post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        const newCounts = { ...reactionCounts };
        if (newCounts[reactionType]) {
          newCounts[reactionType]! -= 1;
          if (newCounts[reactionType] === 0) {
            delete newCounts[reactionType];
          }
        }
        onReactionChange(null, newCounts);
      } else {
        // Add or update the reaction
        const { error } = await supabase
          .from('community_post_reactions')
          .upsert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (error) throw error;

        // Update local state
        const newCounts = { ...reactionCounts };
        
        // Remove count from previous reaction
        if (currentUserReaction && newCounts[currentUserReaction]) {
          newCounts[currentUserReaction]! -= 1;
          if (newCounts[currentUserReaction] === 0) {
            delete newCounts[currentUserReaction];
          }
        }
        
        // Add count to new reaction
        newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
        
        onReactionChange(reactionType, newCounts);
      }

      setOpen(false);
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setAnimatingReaction(null), 600);
    }
  };

  const getTotalReactionCount = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  const getTopReactions = () => {
    return Object.entries(reactionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type: type as ReactionType, count }));
  };

  const ReactionButton = ({ 
    reaction, 
    count, 
    isUserReaction = false 
  }: { 
    reaction: ReactionType; 
    count: number; 
    isUserReaction?: boolean;
  }) => (
    <motion.div
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant={isUserReaction ? "default" : "ghost"}
        size="sm"
        className={`h-9 px-3 rounded-full transition-all duration-200 ${
          isUserReaction 
            ? `${REACTION_CONFIG[reaction].color} bg-primary/10 hover:bg-primary/20` 
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        }`}
        onClick={() => handleReactionClick(reaction)}
        disabled={disabled}
      >
        <motion.span
          className="mr-2 text-base"
          animate={animatingReaction === reaction ? { 
            scale: [1, 1.3, 1],
            rotate: [0, -10, 10, 0]
          } : {}}
          transition={{ duration: 0.6 }}
        >
          {REACTION_CONFIG[reaction].emoji}
        </motion.span>
        <span className="text-sm font-medium">{count}</span>
      </Button>
    </motion.div>
  );

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Existing reactions */}
      <AnimatePresence mode="popLayout">
        {getTopReactions().map(({ type, count }) => (
          <ReactionButton 
            key={type} 
            reaction={type} 
            count={count} 
            isUserReaction={currentUserReaction === type}
          />
        ))}
      </AnimatePresence>

      {/* Reaction picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
            disabled={disabled}
          >
            {currentUserReaction && getTotalReactionCount() === 0 ? (
              <>
                <span className="mr-2 text-base">
                  {REACTION_CONFIG[currentUserReaction].emoji}
                </span>
                <span className="text-sm">React</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm">React</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2" 
          align="start"
          side="top"
          sideOffset={8}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="flex items-center gap-1"
          >
            {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([type, config]) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReactionClick(type)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                  currentUserReaction === type ? 'bg-primary/10 ring-2 ring-primary/20' : ''
                }`}
                disabled={disabled}
                title={config.label}
              >
                <span className="text-xl">{config.emoji}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {config.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </PopoverContent>
      </Popover>

      {/* Total count indicator */}
      {getTotalReactionCount() > 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center text-xs text-muted-foreground ml-1"
        >
          <span>+{getTotalReactionCount() - 3} more</span>
        </motion.div>
      )}
    </div>
  );
};