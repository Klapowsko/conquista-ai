'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ProgressResult, Wallet } from '@/types';
import { shopAPI } from '@/lib/api';

type ToastTone = 'success' | 'error' | 'info' | 'levelup';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

interface GameContextValue {
  wallet: Wallet | null;
  refreshWallet: () => Promise<void>;
  /** Atualiza a carteira e mostra o que foi ganho/estornado. */
  applyProgress: (result: ProgressResult, what: string) => void;
  setWallet: (wallet: Wallet) => void;
  notify: (tone: ToastTone, title: string, detail?: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de <GameProvider>');
  return ctx;
}

export default function GameProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const notify = useCallback((tone: ToastTone, title: string, detail?: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, tone, title, detail }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'levelup' ? 6000 : 3500);
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
      if (coins > 0 || xp > 0) {
        notify('success', `${what}! +${coins} 🪙`, `+${xp} XP`);
      } else if (coins < 0 || xp < 0) {
        notify('info', `${what}`, `${coins} 🪙 · ${xp} XP estornados`);
      }
      if (result.level_up) {
        notify('levelup', `Subiram para o nível ${result.wallet.level}! 🎉`, 'Continuem assim, casal!');
      }
    },
    [notify],
  );

  useEffect(() => {
    shopAPI.wallet().then(setWallet).catch(() => {});
  }, []);

  const toneClass: Record<ToastTone, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-800 text-white',
    levelup: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg',
  };

  return (
    <GameContext.Provider value={{ wallet, refreshWallet, applyProgress, setWallet, notify }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-xl shadow-lg px-5 py-3 max-w-sm w-full sm:w-auto animate-[toast-in_200ms_ease-out] ${toneClass[t.tone]}`}
          >
            <div className="font-semibold">{t.title}</div>
            {t.detail && <div className="text-sm opacity-90">{t.detail}</div>}
          </div>
        ))}
      </div>
    </GameContext.Provider>
  );
}
