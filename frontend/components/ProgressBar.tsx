'use client';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({ 
  progress, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  const getProgressColor = () => {
    if (clampedProgress === 100) return 'bg-green-500';
    if (clampedProgress > 0) return 'bg-amber-500';
    return 'bg-blue-500';
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-600">Progresso</span>
          <span className="text-xs font-semibold text-gray-900">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeClasses()}`}>
        <div
          className={`${getProgressColor()} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

