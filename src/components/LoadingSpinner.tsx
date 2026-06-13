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
    ? 'min-h-screen flex items-center justify-center bg-[#f5f5f5]'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#d4b886] rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    </div>
  );
}