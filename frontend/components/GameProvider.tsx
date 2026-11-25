'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ProgressResult, Wallet } from '@/types';
import { shopAPI } from '@/lib/api';
import { CoinAmount, LevelBadge, XP } from './ui';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  coins?: number;
  xp?: number;
}

interface GameContextValue {
  wallet: Wallet | null;
  refreshWallet: () => Promise<void>;
  /** Atualiza a carteira e mostra o que foi ganho/estornado. */
  applyProgress: (result: ProgressResult, what: string) => void;
  setWallet: (wallet: Wallet) => void;
  notify: (tone: ToastTone, title: string, coins?: number, xp?: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de <GameProvider>');
  return ctx;
}

const CONFETTI = ['🎉', '⭐', '✨', '🏆', '💜', '🪙', '🎊', '⚡'];

export default function GameProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const nextId = useRef(1);

  const notify = useCallback((tone: ToastTone, title: string, coins?: number, xp?: number) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, tone, title, coins, xp }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const refreshWallet = useCallback(async () => {
    try {
      setWallet(await shopAPI.wallet());
    } catch {
      // A navbar só não mostra o saldo; as páginas exibem o erro de conexão.
    }
  }, []);

  const applyProgress = useCallback(
    (result: ProgressResult, what: string) => {
      setWallet(result.wallet);
      const { coins, xp } = result.change;
      if (coins !== 0 || xp !== 0) notify(coins > 0 ? 'success' : 'info', what, coins, xp);
      if (result.level_up) setLevelUp(result.wallet.level);
    },
    [notify],
  );

  useEffect(() => {
    shopAPI.wallet().then(setWallet).catch(() => {});
  }, []);

  useEffect(() => {
    if (levelUp === null) return;
    const t = setTimeout(() => setLevelUp(null), 5000);
    return () => clearTimeout(t);
  }, [levelUp]);

  const toneClass: Record<ToastTone, string> = {
    success: 'bg-white border-emerald-400',
    error: 'bg-rose-50 border-rose-400 text-rose-800',
    info: 'bg-white border-slate-300',
  };

  return (
    <GameContext.Provider value={{ wallet, refreshWallet, applyProgress, setWallet, notify }}>
      {children}

      <div className="fixed bottom-24 sm:bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto rounded-2xl border-2 border-b-4 px-5 py-3 w-full sm:w-80 shadow-lg animate-[toast-in_220ms_ease-out] ${toneClass[t.tone]}`}>
            <div className="font-extrabold">{t.title}</div>
            {(t.coins !== undefined || t.xp !== undefined) && (
              <div className="flex gap-4 mt-1 text-lg">
                {t.coins !== undefined && t.coins !== 0 && (
                  <CoinAmount value={t.coins} sign className={t.coins > 0 ? 'text-amber-600' : 'text-slate-500'} />
                )}
                {t.xp !== undefined && t.xp !== 0 && <XP value={t.xp} className={t.xp < 0 ? 'text-slate-500' : ''} />}
              </div>
            )}
          </div>
        ))}
      </div>

      {levelUp !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-violet-950/70 backdrop-blur-sm p-4" onClick={() => setLevelUp(null)}>
          {CONFETTI.map((c, i) => (
            <span key={i} aria-hidden className="absolute text-3xl"
              style={{ left: `${10 + i * 11}%`, bottom: '30%', animation: `float-up ${1.6 + (i % 3) * 0.4}s ease-out ${i * 0.12}s infinite` }}>
              {c}
            </span>
          ))}
          <div className="relative card px-10 py-8 text-center animate-[pop_500ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-extrabold uppercase tracking-[0.3em] text-violet-500 mb-3">Level up!</div>
            <LevelBadge level={levelUp} size={96} />
            <div className="font-game text-4xl text-slate-900 mt-4">Nível {levelUp}!</div>
            <p className="text-slate-500 font-semibold mt-1 mb-6">O casal está imparável. Continuem assim!</p>
            <button className="btn btn-primary btn-lg" onClick={() => setLevelUp(null)}>Bora!</button>
          </div>
        </div>
      )}
    </GameContext.Provider>
  );
}
