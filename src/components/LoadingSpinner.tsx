'use client';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = '加载中...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const containerClass = fullScreen
    ? 'h-full flex items-center justify-center bg-background'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}