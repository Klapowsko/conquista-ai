'use client';

interface StatusBadgeProps {
  status: 'complete' | 'in-progress' | 'started' | 'not-started';
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ 
  status, 
  label,
  size = 'md',
  className = '' 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: '✓',
        };
      case 'in-progress':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-300',
          icon: '⟳',
        };
      case 'started':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-300',
          icon: '▶',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: '○',
        };
    }
  };
  
  const config = getStatusConfig();
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const displayLabel = label || (status === 'complete' ? 'Completo' : 
                                 status === 'in-progress' ? 'Em Progresso' :
                                 status === 'started' ? 'Iniciado' : 'Não Iniciado');
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${config.bg} ${config.text} ${config.border} border rounded-full font-medium ${sizeClasses} ${className}`}
    >
      <span className="text-xs">{config.icon}</span>
      {displayLabel}
    </span>
  );
}

