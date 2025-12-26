'use client';

import { OKR } from '@/types';
import Link from 'next/link';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import CategoryTooltip from './CategoryTooltip';
import { getOKRStatus } from '@/lib/utils';

interface OKRCardProps {
  okr: OKR;
  onDelete: (id: number) => void;
  progress?: number;
}

export default function OKRCard({ okr, onDelete, progress = 0 }: OKRCardProps) {
  const status = getOKRStatus(progress);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/okrs/${okr.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors line-clamp-2 mb-2">
              {okr.objective}
            </h3>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {okr.category && (
              <CategoryTooltip categoryName={okr.category.name} position="top">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 cursor-help hover:bg-blue-100 transition-colors">
                  {okr.category.name}
                </span>
              </CategoryTooltip>
            )}
            <StatusBadge status={status} size="sm" />
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm(`Tem certeza que deseja deletar o OKR "${okr.objective}"?`)) {
              onDelete(okr.id);
            }
          }}
          className="text-gray-400 hover:text-red-600 ml-2 transition-colors opacity-0 group-hover:opacity-100"
          title="Deletar OKR"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
      
      <div className="mt-4 mb-4">
        <ProgressBar progress={progress} size="sm" />
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href={`/okrs/${okr.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          Ver detalhes
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

