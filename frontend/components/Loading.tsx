export default function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
        <div className="text-gray-600">{label}</div>
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 text-center">
      <p className="mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
          Tentar de novo
        </button>
      )}
    </div>
  );
}
