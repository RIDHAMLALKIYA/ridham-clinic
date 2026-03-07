import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import ClientLayoutEffects from '@/components/ClientLayoutEffects';
import { ClinicSoundProvider } from '@/components/ClinicSoundProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HealthCor Clinic | Elite Medical Care',
  description: 'Premium Intelligent Clinic Management System.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ClientLayoutEffects />

          <ClinicSoundProvider>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50">
              <Navbar />
            </div>
            <main className="flex-1 w-full relative z-10 font-outfit">
              {children}
            </main>

            {/* Minimal Footer */}
            <footer className="w-full py-12 px-6 text-center opacity-30">
              <p className="text-[9px] font-black uppercase tracking-[1em] text-slate-500">
                HealthCor Systems &bull; Neural Protocol v1.4.2
              </p>
            </footer>
          </ClinicSoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
