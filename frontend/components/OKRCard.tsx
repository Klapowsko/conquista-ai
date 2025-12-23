'use client';

import { OKR } from '@/types';
import Link from 'next/link';

interface OKRCardProps {
  okr: OKR;
  onDelete: (id: number) => void;
}

export default function OKRCard({ okr, onDelete }: OKRCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link href={`/okrs/${okr.id}`}>
            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
              {okr.objective}
            </h3>
          </Link>
          {okr.category && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {okr.category.name}
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(okr.id)}
          className="text-red-500 hover:text-red-700 ml-2"
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
      <div className="mt-4">
        <Link
          href={`/okrs/${okr.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver detalhes →
        </Link>
      </div>
    </div>
  );
}

