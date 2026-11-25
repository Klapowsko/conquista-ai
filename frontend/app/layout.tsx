import type { Metadata } from 'next';
import { Lilita_One, Nunito } from 'next/font/google';
import './globals.css';
import GameProvider from '@/components/GameProvider';
import Navbar from '@/components/Navbar';

const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });
const lilita = Lilita_One({ variable: '--font-lilita', subsets: ['latin'], weight: '400' });

export const metadata: Metadata = {
  title: 'Conquista - Objetivos do casal',
  description: 'Objetivos gamificados: conclua metas, ganhe moedas, suba de nível e troque por recompensas.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunito.variable} ${lilita.variable} antialiased min-h-screen`}>
        <GameProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-12">{children}</main>
        </GameProvider>
      </body>
    </html>
  );
}
