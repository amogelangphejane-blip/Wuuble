import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

/**
 * Custom hook for managing loading states throughout the application
 * @param initialMessage - Initial loading message
 * @returns Object with loading state and control functions
 */
export const useLoading = (initialMessage: string = "Loading..."): UseLoadingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  const showLoading = useCallback((newMessage?: string) => {
    if (newMessage) {
      setMessage(newMessage);
    }
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
  }, []);

  return {
    isLoading,
    message,
    showLoading,
    hideLoading,
    setLoadingMessage,
  };
};

export default useLoading;