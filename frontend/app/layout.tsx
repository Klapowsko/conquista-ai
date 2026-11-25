import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import GameProvider from '@/components/GameProvider';
import Navbar from '@/components/Navbar';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Conquista - Objetivos do casal',
  description: 'Objetivos gamificados: conclua metas, ganhe moedas, suba de nível e troque por recompensas.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        <GameProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">{children}</main>
        </GameProvider>
      </body>
    </html>
  );
}
