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
} from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useLanguage } from '../providers/LanguageProvider';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Hydration safe check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      if (scrolled) setIsVisible(true);
      else if (!isMenuOpen) setIsVisible(false);
    };

    // Initial check
    if (window.scrollY > 20) {
      setIsScrolled(true);
      setIsVisible(true);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  // Handle mouse movement for the top area
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return; // Desktop only
      if (isScrolled || isMenuOpen) return;

      // If mouse is in the top 80px, show nav
      if (e.clientY < 80) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isScrolled, isMenuOpen]);

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
      {/* Dynamic Spacer to prevent content jump when nav is fixed */}
      <div
        className={`transition-all duration-700 ${isScrolled || isVisible ? 'h-24' : 'h-0 lg:h-0'}`}
      ></div>

      <nav
        ref={navRef}
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform
                ${!isMounted ? 'translate-y-0 opacity-100' : isVisible || isMenuOpen || isScrolled ? 'translate-y-0 opacity-100' : 'max-lg:translate-y-0 max-lg:opacity-100 -translate-y-full opacity-0'}`}
      >
        <div
          className={`mx-3 sm:mx-4 mt-4 lg:mt-6 rounded-[1.8rem] md:rounded-[2.8rem] border border-white/10 transition-all duration-700 shadow-2xl overflow-hidden glass-vip-polished
                    ${isScrolled || isMenuOpen ? 'border-beam' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            <div className="flex justify-between h-20 items-center">
              {/* Logo */}
              <Link
                href="/"
                onClick={closeMenu}
                className="flex-shrink-0 flex items-center gap-5 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/30 blur-2xl group-hover:bg-emerald-500/50 transition-all duration-1000"></div>
                  <div className="bg-slate-900 dark:bg-white p-2.5 rounded-2xl relative z-10 transition-all shadow-2xl group-hover:rotate-[12deg] group-hover:scale-110 duration-700 border border-white/5">
                    <Stethoscope className="h-6 w-6 text-white dark:text-black" />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-emerald-500 transition-colors duration-500 leading-none">
                    HealthCor <span className="text-emerald-500">Clinic v1.5.</span>
                  </span>
                  {/* Deployment Verification Beacon */}
                  <span className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] md:tracking-[0.5em] mt-1 ml-0.5">{t('nav.branding')}</span>
                </div>
              </Link>

              {/* Desktop Links */}
              <div className="hidden lg:flex items-center space-x-2">
                {desktopLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative flex items-center gap-3 px-6 py-3 text-slate-900 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 font-black text-[12px] uppercase tracking-widest transition-all duration-700 group/navitem rounded-2xl hover:bg-emerald-500/5"
                  >
                    <span className="opacity-0 group-hover/navitem:opacity-100 group-hover/navitem:translate-x-0 -translate-x-3 transition-all duration-700 transform scale-90 text-emerald-500">
                      {link.icon}
                    </span>
                    <span className="group-hover/navitem:translate-x-1 transition-transform duration-700">
                      {link.name}
                    </span>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-emerald-500 rounded-full group-hover/navitem:w-1/3 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </Link>
                ))}

                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-6 opacity-50"></div>

                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all active:scale-95 group/lang"
                >
                  <Globe className="w-4 h-4 text-emerald-500 group-hover/lang:rotate-45 transition-transform" />
                  <span className="text-slate-900 dark:text-white">{language === 'en' ? 'EN' : 'ગુજ'}</span>
                </button>

                <Link
                  href="/doctor/dashboard"
                  className="relative overflow-hidden flex items-center gap-3 bg-slate-900 dark:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl group/btn active:scale-95 border border-white/10 hover:shadow-emerald-500/20 ml-3"
                >
                  <Activity className="w-4 h-4 text-emerald-300 group-hover/btn:animate-[pulse_1s_infinite]" />
                  <span>{t('nav.console')}</span>
                </Link>

                <Link
                  href="/admin"
                  className="flex items-center gap-3 text-slate-900 dark:text-white bg-white/5 dark:bg-black/20 hover:bg-slate-50 dark:hover:bg-white/5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 shadow-sm active:scale-95 group/admin ml-3"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t('nav.admissions')}</span>
                </Link>

                <div className="ml-4">
                  <ThemeToggle />
                </div>
              </div>

              <div className="lg:hidden flex items-center gap-2 md:gap-3">
                <button
                  onClick={toggleLanguage}
                  className="p-3 md:p-4 bg-slate-100 dark:bg-white/5 rounded-xl md:rounded-2xl text-slate-600 dark:text-white hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                >
                  <Globe className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <ThemeToggle />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-3 md:p-4 bg-slate-100 dark:bg-white/5 rounded-xl md:rounded-2xl text-slate-600 dark:text-white hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-all active:scale-90 shadow-sm"
                >
                  {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] border-t border-slate-200 dark:border-white/5 overflow-hidden
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
