'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'amber' | 'purple';
  className?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon,
  trend,
  color = 'blue',
  className = '' 
}: StatCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconText: 'text-green-600',
          value: 'text-green-700',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          iconText: 'text-amber-600',
          value: 'text-amber-700',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          iconText: 'text-purple-600',
          value: 'text-purple-700',
        };
      default:
        return {
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
          value: 'text-blue-700',
        };
    }
  };
  
  const colors = getColorClasses();
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className={`${colors.iconBg} ${colors.iconText} p-2 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <p className={`text-3xl font-bold ${colors.value}`}>{value}</p>
        {trend && (
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

