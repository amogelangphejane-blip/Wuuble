import { useState } from 'react';
import { Plus } from 'lucide-react';

interface SimpleEventButtonProps {
  communityId: string;
  onSuccess?: () => void;
}

export const SimpleEventButton = ({ communityId, onSuccess }: SimpleEventButtonProps) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    console.log('🚨 SIMPLE BUTTON CLICKED!');
    console.log('Community ID:', communityId);
    setClicked(true);
    
    // Visual feedback
    alert(`✅ Button click registered!\n\nCommunity ID: ${communityId}\nTimestamp: ${new Date().toLocaleTimeString()}\n\nIf you see this alert, the basic button functionality is working.`);
    
    setTimeout(() => setClicked(false), 2000);
    onSuccess?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${clicked 
          ? 'bg-green-500 text-white transform scale-95' 
          : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
        }
        flex items-center gap-2 shadow-lg
      `}
      style={{
        minHeight: '44px',
        minWidth: '120px'
      }}
    >
      <Plus className="w-4 h-4" />
      {clicked ? 'Clicked!' : 'Create Event'}
    </button>
  );
};