'use client';

import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  progress?: number; // 0-100 for progress bar
  variant?: 'default' | 'fullscreen' | 'inline';
  estimatedTime?: number; // estimated seconds
}

export default function LoadingSpinner({ 
  message = 'Processing your CSV...', 
  subMessage,
  progress,
  variant = 'default',
  estimatedTime
}: LoadingSpinnerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const progressValue = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <LoadingSpinnerContent 
              message={message}
              subMessage={subMessage}
              progress={progressValue}
              dots={dots}
              elapsedTime={elapsedTime}
              estimatedTime={estimatedTime}
              formatTime={formatTime}
            />
          </div>
        </div>
      </div>
    );
  }

  // Inline variant for small spaces
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">
          {message}
          <span className="text-gray-400">{dots}</span>
        </span>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <LoadingSpinnerContent 
        message={message}
        subMessage={subMessage}
        progress={progressValue}
        dots={dots}
        elapsedTime={elapsedTime}
        estimatedTime={estimatedTime}
        formatTime={formatTime}
      />
    </div>
  );
}

// Helper component for shared content
function LoadingSpinnerContent({ 
  message, 
  subMessage, 
  progress, 
  dots, 
  elapsedTime, 
  estimatedTime, 
  formatTime 
}: any) {
  // Determine spinner size based on progress
  const spinnerSize = progress !== undefined ? 'w-16 h-16' : 'w-14 h-14';

  return (
    <>
      {/* Animated Spinner */}
      <div className="relative">
        <div className={`${spinnerSize} border-4 border-blue-100 rounded-full animate-spin`}>
          <div className={`${spinnerSize} border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0`}></div>
        </div>
        {progress !== undefined && progress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">{progress}%</span>
          </div>
        )}
      </div>

      {/* Message */}
      <p className="mt-5 text-lg font-medium text-gray-800 text-center">
        {message}
        <span className="text-blue-600">{dots}</span>
      </p>

      {/* Sub message */}
      {subMessage && (
        <p className="mt-1 text-sm text-gray-500 text-center">
          {subMessage}
        </p>
      )}

      {/* Progress Bar */}
      {progress !== undefined && progress > 0 && progress < 100 && (
        <div className="w-full max-w-xs mt-4">
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Time info */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        {elapsedTime > 0 && (
          <span>⏱️ Elapsed: {formatTime(elapsedTime)}</span>
        )}
        {estimatedTime && elapsedTime < estimatedTime && (
          <span>⏳ Estimated: {formatTime(estimatedTime - elapsedTime)} remaining</span>
        )}
      </div>

      {/* Animated dots loader for text */}
      <div className="mt-3 flex items-center gap-1">
        <div className={`w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    </>
  );
}