import React, { useEffect, useState } from 'react';
import { useLoadingContext } from '@/contexts/LoadingContext';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
  showProgress?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 3000,
  showProgress = false
}) => {
  const { showLoading, hideLoading, updateProgress } = useLoadingContext();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash screen immediately
    showLoading({
      variant: 'splash',
      message: 'Welcome to Wuuble',
      subMessage: 'Connecting you to amazing experiences',
      showProgress,
      progress: 0,
    });

    if (showProgress) {
      // Simulate loading progress
      const progressInterval = 50; // Update every 50ms
      const totalSteps = duration / progressInterval;
      let currentStep = 0;

      const progressTimer = setInterval(() => {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;
        
        if (progress >= 100) {
          updateProgress(100, 'Ready!', 'Welcome to Wuuble');
          clearInterval(progressTimer);
          
          // Hide after showing complete state briefly
          setTimeout(() => {
            hideLoading();
            setIsVisible(false);
            onComplete?.();
          }, 500);
        } else {
          // Update progress with different messages based on progress
          let message = 'Welcome to Wuuble';
          let subMessage = 'Connecting you to amazing experiences';
          
          if (progress > 20) {
            message = 'Loading your experience...';
            subMessage = 'Setting up your personalized environment';
          }
          if (progress > 50) {
            message = 'Almost ready...';
            subMessage = 'Finalizing your setup';
          }
          if (progress > 80) {
            message = 'Just a moment more...';
            subMessage = 'Preparing to launch';
          }
          
          updateProgress(progress, message, subMessage);
        }
      }, progressInterval);

      return () => {
        clearInterval(progressTimer);
      };
    } else {
      // Simple timer without progress
      const timer = setTimeout(() => {
        hideLoading();
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [duration, showProgress, showLoading, hideLoading, updateProgress, onComplete]);

  // This component doesn't render anything visible itself
  // The actual splash screen is rendered by GlobalLoadingOverlay
  return null;
};

export default SplashScreen;