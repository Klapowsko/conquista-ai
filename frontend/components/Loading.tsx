export default function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-bounce">🎲</div>
        <div className="font-game text-xl text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-rose-200 p-8 text-center" style={{ boxShadow: '0 4px 0 #fecdd3' }}>
      <div className="text-4xl mb-2">💥</div>
      <p className="font-bold text-rose-700 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-danger">
          Tentar de novo
        </button>
      )}
    </div>
  );
}
