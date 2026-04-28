'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Stethoscope,
  Menu,
  X,
  ChevronRight,
  Calendar,
  UserCheck,
  Users,
  ShieldCheck,
  Activity,
  Heart,
  Globe,
  Settings,
} from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useLanguage } from '../providers/LanguageProvider';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Hydration safe check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 20);

      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !isMenuOpen) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current || currentScrollY <= 100) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const desktopLinks = [
    { name: t('nav.reservations'), href: '/', icon: <Calendar className="w-4 h-4" /> },
    { name: t('nav.checkin'), href: '/checkin', icon: <UserCheck className="w-4 h-4" /> },
    { name: t('nav.lobby'), href: '/queue', icon: <Users className="w-4 h-4" /> },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'gu' : 'en');
  };

  return (
    <>
      {/* Fixed Spacer to prevent content jump when nav is fixed */}
      <div className="h-28 lg:h-32 transition-all duration-700"></div>

      <nav
        ref={navRef}
        className={`fixed top-0 inset-x-0 z-[100] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform
                ${!isMounted ? 'translate-y-0 opacity-100' : isVisible || isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div
          className={`mx-3 sm:mx-4 mt-4 lg:mt-6 rounded-[1.8rem] md:rounded-[2.8rem] border border-white/10 transition-all duration-700 shadow-2xl glass-vip-polished
                    ${isScrolled || isMenuOpen ? 'border-beam' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            <div className="flex justify-between h-20 items-center">
              {/* Logo */}
              <Link
                href="/"
                onClick={closeMenu}
                className="flex-shrink-0 flex items-center gap-3 sm:gap-5 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/30 blur-2xl group-hover:bg-emerald-500/50 transition-all duration-1000"></div>
                  <div className="bg-slate-900 dark:bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl relative z-10 transition-all shadow-2xl group-hover:rotate-[12deg] group-hover:scale-110 duration-700 border border-white/5">
                    <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-white dark:text-black" />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                    <span className="hidden sm:inline">HealthCor Clinic</span>
                    <span className="sm:hidden">HealthCor</span>
                  </span>
                  <span className="text-[7px] sm:text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-emerald-500/40 uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-0.5 sm:mt-1 ml-0.5 truncate">
                    Elite Medical Node
                  </span>
                </div>
              </Link>

              {/* Desktop Links */}
              <div className="hidden xl:flex items-center space-x-2 flex-shrink-0">
                {desktopLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative flex flex-col items-center justify-center px-3 py-3 text-slate-900 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-700 group/navitem rounded-2xl hover:bg-emerald-500/5 min-w-[80px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-0 group-hover/navitem:opacity-100 group-hover/navitem:translate-x-0 -translate-x-3 transition-all duration-700 transform scale-90 text-emerald-500">
                        {link.icon}
                      </span>
                      <span className="font-black text-[11px] uppercase tracking-widest group-hover/navitem:translate-x-1 transition-transform duration-700">
                        {link.name}
                      </span>
                    </div>
                    {language === 'gu' && (
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-50 group-hover/navitem:opacity-100 transition-opacity">
                        {link.href === '/' ? 'RESERVATIONS' : link.href === '/checkin' ? 'CHECK-IN' : 'LOBBY'}
                      </span>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-emerald-500 rounded-full group-hover/navitem:w-1/3 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </Link>
                ))}

                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 opacity-50"></div>

                <Link
                  href="/doctor/dashboard"
                  className="relative overflow-hidden flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl group/btn active:scale-95 border border-white/10 hover:shadow-emerald-500/20"
                >
                  <Activity className="w-4 h-4 text-emerald-300 group-hover/btn:animate-[pulse_1s_infinite]" />
                  <span>{t('nav.console')}</span>
                </Link>

                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-slate-900 dark:text-white bg-white/5 dark:bg-black/20 hover:bg-slate-50 dark:hover:bg-white/5 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 shadow-sm active:scale-95 group/admin ml-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t('nav.admissions')}</span>
                </Link>

                <div className="ml-2 relative">
                  <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    onBlur={() => setTimeout(() => setIsSettingsOpen(false), 200)}
                    className={`w-10 h-10 rounded-2xl flex flex-shrink-0 items-center justify-center transition-all duration-500 shadow-sm active:scale-95 z-10 ${isSettingsOpen ? 'bg-emerald-500 text-white shadow-emerald-500/30 border border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-emerald-500 hover:border-emerald-300'}`}
                    title="Settings"
                  >
                    <Settings className={`w-5 h-5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSettingsOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>

                  {/* Settings Dropdown */}
                  <div className={`absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl transition-all duration-300 transform origin-top-right z-[110] flex flex-col overflow-hidden ${isSettingsOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-2 scale-95'}`}>
                    <div className="p-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">Theme</span>
                      <div className="scale-90 origin-right -ml-2">
                        <ThemeToggle />
                      </div>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 pt-1 pb-1">Language</span>
                      <button
                        onClick={() => { setLanguage('en'); setIsSettingsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${language === 'en' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <span className="text-xl leading-none">🇬🇧</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest">English (UK)</span>
                      </button>
                      <button
                        onClick={() => { setLanguage('gu'); setIsSettingsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${language === 'gu' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <span className="text-xl leading-none">🇮🇳</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest">Gujarati (IN)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:hidden flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0 pl-1">
                <div className="relative group/mobilelang">
                  <button
                    className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl md:rounded-2xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90 border border-emerald-500/20 focus:outline-none"
                  >
                    <span className="text-sm md:text-base leading-none">{language === 'en' ? '🇬🇧' : '🇮🇳'}</span>
                    <span className="text-[9px] sm:text-[10px] font-black">{language === 'en' ? 'ENG' : 'GUJ'}</span>
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover/mobilelang:opacity-100 group-hover/mobilelang:visible focus-within:opacity-100 focus-within:visible transition-all duration-300 z-[110] overflow-hidden flex flex-col">
                      <button
                        onClick={() => { setLanguage('en'); (document.activeElement as HTMLElement)?.blur(); }}
                        className={`w-full flex items-center gap-2 px-3 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${language === 'en' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <span className="text-lg leading-none">🇬🇧</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">EN (UK)</span>
                      </button>
                      <button
                        onClick={() => { setLanguage('gu'); (document.activeElement as HTMLElement)?.blur(); }}
                        className={`w-full flex items-center gap-2 px-3 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-t border-slate-100 dark:border-white/5 ${language === 'gu' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <span className="text-lg leading-none">🇮🇳</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">GUJ (IN)</span>
                      </button>
                  </div>
                </div>
                <div className="scale-75 sm:scale-90 md:scale-100">
                  <ThemeToggle />
                </div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 sm:p-3 md:p-4 bg-slate-900 dark:bg-white/10 rounded-xl md:rounded-2xl text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 transition-all active:scale-90 shadow-lg flex items-center justify-center gap-2 group border border-transparent dark:border-white/10"
                >
                  {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-180 transition-transform duration-500" />}
                  <span className="sr-only">Toggle menu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`xl:hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] border-t border-slate-200 dark:border-white/5 overflow-hidden rounded-b-[1.8rem] md:rounded-b-[2.8rem]
                        ${isMenuOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="p-4 sm:p-8 space-y-3 sm:space-y-5 bg-slate-50/80 dark:bg-black/40 backdrop-blur-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
              {[
                {
                  name: t('nav.reservations'),
                  href: '/',
                  icon: <Calendar className="w-5 h-5 text-emerald-500" />,
                },
                {
                  name: t('nav.checkin'),
                  href: '/checkin',
                  icon: <UserCheck className="w-5 h-5 text-teal-500" />,
                },
                {
                  name: t('nav.lobby'),
                  href: '/queue',
                  icon: <Users className="w-5 h-5 text-emerald-500" />,
                },
                {
                  name: t('nav.console'),
                  href: '/doctor/dashboard',
                  icon: <Activity className="w-5 h-5 text-red-500" />,
                },
                {
                  name: t('nav.admissions'),
                  href: '/admin',
                  icon: <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between p-4 sm:p-6 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] text-slate-900 dark:text-white font-black uppercase text-[10px] sm:text-[11px] tracking-widest hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-black/50 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
