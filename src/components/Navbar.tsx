import { useState } from 'react';
import { motion } from 'motion/react';
import { Wifi, LogIn, User, LayoutDashboard, LogOut, PhoneCall } from 'lucide-react';
import { CustomerUser } from '../types';
import Logo from './Logo';

interface NavbarProps {
  currentUser: CustomerUser | { isAdmin: boolean } | { isDeveloper: boolean } | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  companyName?: string;
  logoUrl?: string;
  tagline?: string;
  coverageStats?: { cities: number; kecamatans: number; kelurahans: number };
  contactPhone?: string;
}

export default function Navbar({ currentUser, onLogout, onNavigate, currentPage, companyName, logoUrl, tagline, coverageStats, contactPhone }: NavbarProps) {
  const [activeItem, setActiveItem] = useState<string>('promosi');
  const isAdmin = currentUser && 'isAdmin' in currentUser && (currentUser as any).isAdmin;
  const isDeveloper = currentUser && 'isDeveloper' in currentUser && (currentUser as any).isDeveloper;
  const isCustomer = currentUser && !('isAdmin' in currentUser) && !('isDeveloper' in currentUser);
  const customerUser = isCustomer ? (currentUser as CustomerUser) : null;

  // Real-time stats with fallback
  const citiesCount = coverageStats?.cities ?? 9;
  const kecamatansCount = coverageStats?.kecamatans ?? 81;
  const kelurahansCount = coverageStats?.kelurahans ?? 123;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      {/* Top Bar info */}
      <div className="bg-blue-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5 font-medium">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span>AREA CAKUPAN: <strong className="text-yellow-400">{citiesCount} Kota/Kabupaten, {kecamatansCount} Kecamatan, {kelurahansCount} Kelurahan</strong></span>
          </div>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3 h-3 text-yellow-400" /> LAYANAN KONSUMEN: <strong>{contactPhone || '+62 899-3299-977'}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer min-w-0 flex-shrink"
          >
            <Logo companyName={companyName} logoUrl={logoUrl} tagline={tagline} />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-7 text-sm font-semibold text-slate-600">
            <div className="relative py-1">
              <button
                onClick={() => {
                  onNavigate('home');
                  setActiveItem('promosi');
                }}
                className={`hover:text-blue-600 transition-colors ${currentPage === 'home' && activeItem === 'promosi' ? 'text-blue-600 font-bold' : ''}`}
              >
                Promosi
              </button>
              {currentPage === 'home' && activeItem === 'promosi' && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>
            
            <div className="relative py-1">
              <button
                onClick={() => {
                  onNavigate('home');
                  setActiveItem('tentang');
                  setTimeout(() => {
                    document.getElementById('tentang-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`hover:text-blue-600 transition-colors ${currentPage === 'home' && activeItem === 'tentang' ? 'text-blue-600 font-bold' : ''}`}
              >
                Tentang
              </button>
              {currentPage === 'home' && activeItem === 'tentang' && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>

            <div className="relative py-1">
              <button
                onClick={() => {
                  onNavigate('home');
                  setActiveItem('cakupan');
                  setTimeout(() => {
                    document.getElementById('cakupan-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`hover:text-blue-600 transition-colors ${currentPage === 'home' && activeItem === 'cakupan' ? 'text-blue-600 font-bold' : ''}`}
              >
                Area Cakupan
              </button>
              {currentPage === 'home' && activeItem === 'cakupan' && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>

            <div className="relative py-1">
              <button
                onClick={() => {
                  onNavigate('home');
                  setActiveItem('produk');
                  setTimeout(() => {
                    document.getElementById('paket-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`hover:text-blue-600 transition-colors ${currentPage === 'home' && activeItem === 'produk' ? 'text-blue-600 font-bold' : ''}`}
              >
                Produk
              </button>
              {currentPage === 'home' && activeItem === 'produk' && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>

            <div className="relative py-1">
              <button
                onClick={() => {
                  onNavigate('home');
                  setActiveItem('faq');
                  setTimeout(() => {
                    document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`hover:text-blue-600 transition-colors ${currentPage === 'home' && activeItem === 'faq' ? 'text-blue-600 font-bold' : ''}`}
              >
                FAQ
              </button>
              {currentPage === 'home' && activeItem === 'faq' && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>

            <div className="relative py-1">
              <button
                onClick={() => {
                  onNavigate('home');
                  setActiveItem('contact');
                  setTimeout(() => {
                    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`hover:text-blue-600 transition-colors ${currentPage === 'home' && activeItem === 'contact' ? 'text-blue-600 font-bold' : ''}`}
              >
                Hubungi Kami
              </button>
              {currentPage === 'home' && activeItem === 'contact' && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isDeveloper) onNavigate('developer-dashboard');
                    else if (isAdmin) onNavigate('admin-dashboard');
                    else onNavigate('customer-dashboard');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] sm:text-xs font-bold transition-all border border-blue-100"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>
                    {isDeveloper ? 'Dev' : isAdmin ? 'Admin' : `${customerUser?.name.split(' ')[0]}`}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600 transition-all border border-slate-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('login-selection')}
                  className="flex items-center gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 text-slate-700 hover:text-blue-600 font-semibold text-xs transition-colors shrink-0"
                >
                  <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">My {companyName || 'Taranet'}</span>
                  <span className="inline sm:hidden">Masuk</span>
                </button>
                <button
                  onClick={() => onNavigate('subscribe')}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 active:scale-95 shrink-0"
                >
                  Berlangganan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
