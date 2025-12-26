'use client';

import { useState, useRef, useEffect } from 'react';
import { getCategorySubcategories, getCategoryDescription } from '@/lib/categories';

interface CategoryTooltipProps {
  categoryName: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function CategoryTooltip({ 
  categoryName, 
  children, 
  position = 'top',
  className = '' 
}: CategoryTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const subcategories = getCategorySubcategories(categoryName);
  const description = getCategoryDescription(categoryName);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  if (subcategories.length === 0) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      {children}
      
      {(showTooltip) && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionClasses()} w-64`}
        >
          <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4">
            {description && (
              <p className="text-xs text-gray-300 mb-3">{description}</p>
            )}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Subcategorias:
              </p>
              {subcategories.map((sub, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  <span className="text-sm">{sub}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Arrow */}
          <div className={`absolute ${getArrowClasses()} border-4`}></div>
        </div>
      )}
    </div>
  );
}

