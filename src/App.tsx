import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import SubscriptionForm from './components/SubscriptionForm';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import DeveloperDashboard from './components/DeveloperDashboard';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import { CustomerUser, SupportTicket } from './types';
import { ShieldAlert, User, CheckCircle, Wifi, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Company Branding settings
  const [companySettings, setCompanySettings] = useState<{
    name: string;
    address: string;
    logoText: string;
    themeColor: string;
    logoUrl?: string;
    tagline?: string;
    billingDate?: number;
    contactPhone?: string;
  }>({
    name: 'Taranet WiFi',
    address: 'Jl. Raya WiFi No. 12, Jakarta',
    logoText: 'TARANET',
    themeColor: '#2563eb',
    logoUrl: '',
    tagline: 'ULTRA BROADBAND',
    billingDate: 20,
    contactPhone: '+62 899-3299-977'
  });

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<CustomerUser | { isAdmin: boolean } | { isDeveloper: boolean } | null>(null);

  // Admin Data states
  const [adminCustomers, setAdminCustomers] = useState<CustomerUser[]>([]);
  const [adminSupportTickets, setAdminSupportTickets] = useState<SupportTicket[]>([]);
  const [adminWhatsappLogs, setAdminWhatsappLogs] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // Fetch all packages
  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  };

  // Real-time Coverage Statistics
  const [coverageStats, setCoverageStats] = useState({ cities: 5, kecamatans: 13, kelurahans: 40 });

  const fetchCoverageStats = async () => {
    try {
      const response = await fetch('/api/coverage');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          let cities = data.length;
          let kecamatans = 0;
          let kelurahans = 0;
          data.forEach((city: any) => {
            if (Array.isArray(city.kecamatans)) {
              kecamatans += city.kecamatans.length;
              city.kecamatans.forEach((kec: any) => {
                if (Array.isArray(kec.kelurahans)) {
                  kelurahans += kec.kelurahans.length;
                }
              });
            }
          });
          setCoverageStats({ cities, kecamatans, kelurahans });
        }
      }
    } catch (err) {
      console.error('Failed to fetch coverage stats:', err);
    }
  };

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginIsAdmin, setLoginIsAdmin] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Form registration success message
  const [registrationSuccessUser, setRegistrationSuccessUser] = useState<CustomerUser | null>(null);

  // Fetch company branding settings on mount
  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/settings/company');
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || data;
        if (settings) {
          setCompanySettings(settings);
        }
      }
    } catch (err) {
      console.error('Failed to fetch company settings:', err);
    }
  };

  const handleUpdateCompanySettings = async (newSettings: {
    name: string;
    address: string;
    logoText: string;
    themeColor: string;
    logoUrl?: string;
    tagline?: string;
  }) => {
    try {
      const response = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || data;
        if (settings) {
          setCompanySettings(settings);
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to update company settings:', err);
    }
    return false;
  };

  useEffect(() => {
    fetchCompanySettings();
    fetchPackages();
    fetchCoverageStats();
  }, []);

  // Auto scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Sync admin data or customer data in intervals/actions
  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/data');
      if (response.ok) {
        const data = await response.json();
        setAdminCustomers(data.customers || []);
        setAdminSupportTickets(data.tickets || []);
        setAdminWhatsappLogs(data.whatsappLogs || []);
      }
      // Also fetch latest company settings and coverage statistics so everything is real-time
      await fetchCompanySettings();
      await fetchCoverageStats();
    } catch (err) {
      console.error('Failed to sync admin data:', err);
    }
  };

  const fetchCustomerProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Failed to sync customer data:', err);
    }
  };

  // Sync active dashboard states
  useEffect(() => {
    let isMounted = true;

    if (currentUser) {
      if ('isAdmin' in currentUser && (currentUser as any).isAdmin) {
        fetchAdminData();
      } else if ('isDeveloper' in currentUser && (currentUser as any).isDeveloper) {
        // Developer profile sync if needed
      } else {
        const customerUser = currentUser as CustomerUser;
        // Only fetch profile from server if we are on dashboard or changing pages,
        // but avoid infinite rendering loop.
        fetch(`/api/customers/${customerUser.id}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Sync failed');
          })
          .then((data) => {
            if (isMounted && data.user) {
              // Deep comparison or just checking if status/payments length changed
              // to avoid setting state with identical objects and infinite looping
              const oldStr = JSON.stringify(customerUser);
              const newStr = JSON.stringify(data.user);
              if (oldStr !== newStr) {
                setCurrentUser(data.user);
              }
            }
          })
          .catch((err) => console.error('Failed to sync customer profile:', err));
      }
    }

    return () => {
      isMounted = false;
    };
  }, [currentPage, (currentUser as any)?.id]);

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackageId(packageId);
    setRegistrationSuccessUser(null);
    setCurrentPage('subscribe');
  };

  // Login action handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Harap masukkan email dan password.');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          isAdmin: loginIsAdmin,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');
        setRegistrationSuccessUser(null);

        if (data.user.isDeveloper) {
          setCurrentPage('developer-dashboard');
        } else if (data.user.isAdmin) {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('customer-dashboard');
        }
      } else {
        const errData = await response.json();
        setLoginError(errData.message || 'Login gagal. Silakan periksa kembali email & password Anda.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Koneksi ke server gagal. Harap coba beberapa saat lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin action handlers
  const handleUpdateCustomerStatus = async (id: string, status: 'pending' | 'active' | 'suspended') => {
    try {
      const response = await fetch('/api/customers/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (response.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyPayment = async (userId: string, paymentId: string) => {
    try {
      const response = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, paymentId }),
      });
      if (response.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async (userId: string, paymentId: string) => {
    try {
      const response = await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, paymentId }),
      });
      if (response.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
  };

  if (currentPage === 'developer-dashboard') {
    return (
      <DeveloperDashboard
        onLogout={handleLogout}
        companyName={companySettings.name}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={(page) => {
          setRegistrationSuccessUser(null);
          setCurrentPage(page);
        }}
        currentPage={currentPage}
        companyName={companySettings.name}
        logoUrl={companySettings.logoUrl}
        tagline={companySettings.tagline}
        coverageStats={coverageStats}
        contactPhone={companySettings.contactPhone}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* Render View depending on state */}
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Home
                onSelectPackage={handleSelectPackage}
                onNavigate={setCurrentPage}
                packages={packages}
                companySettings={companySettings}
                coverageStats={coverageStats}
              />
            </motion.div>
          )}

          {currentPage === 'subscribe' && (
            <motion.div
              key="subscribe"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {registrationSuccessUser ? (
                <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200/80 rounded-3xl shadow-2xl text-center space-y-6 text-xs">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-slate-900">Pendaftaran Berhasil!</h2>
                    <p className="text-slate-500 leading-relaxed">
                      Akun Anda telah sukses dibuat dengan ID Pelanggan <strong className="text-slate-900 font-mono">{registrationSuccessUser.id}</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">Langkah Selanjutnya:</p>
                    <ol className="list-decimal list-inside text-slate-500 space-y-1 text-[11px]">
                      <li>Masuk ke Portal Pelanggan Anda.</li>
                      <li>Selesaikan pembayaran pertama melalui pilihan transfer lokal.</li>
                      <li>Teknisi kami akan segera menjadwalkan instalasi WiFi Anda.</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => {
                      setLoginIsAdmin(false);
                      setLoginEmail(registrationSuccessUser.email);
                      setRegistrationSuccessUser(null);
                      setCurrentPage('login-selection');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 transition-all active:scale-95"
                  >
                    Masuk Ke Portal Saya
                  </button>
                </div>
              ) : (
                <SubscriptionForm
                  selectedPackageId={selectedPackageId}
                  onNavigate={setCurrentPage}
                  onSubmitSuccess={(user) => {
                    setRegistrationSuccessUser(user);
                  }}
                  packages={packages}
                  companyName={companySettings.name}
                />
              )}
            </motion.div>
          )}

          {currentPage === 'login-selection' && (
            <motion.div
              key="login-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200/80 rounded-3xl shadow-2xl text-xs space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Masuk Portal {companySettings.name.toUpperCase()}</h2>
                <p className="text-slate-400">Silakan masukkan akun pelanggan atau panel administrator Anda.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Type selector tab */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIsAdmin(false);
                      setLoginError('');
                    }}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${!loginIsAdmin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                  >
                    Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIsAdmin(true);
                      setLoginError('');
                    }}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${loginIsAdmin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                  >
                    Administrator
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="login-email">ALAMAT EMAIL *</label>
                  <input
                    type="email"
                    id="login-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={loginIsAdmin ? `admin@${(companySettings.name || 'taranet').toLowerCase().replace(/\s+/g, '')}.id` : 'budi@gmail.com'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="login-pass">PASSWORD *</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-pass"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-btn"
                  disabled={loginLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:bg-slate-400"
                >
                  {loginLoading ? 'Menghubungkan...' : 'Masuk Portal'}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-slate-400">Belum punya jaringan {companySettings.name}?</p>
                <button
                  onClick={() => setCurrentPage('subscribe')}
                  className="text-blue-600 hover:underline font-bold mt-1 inline-block"
                >
                  Daftar Langganan Wifi Baru Sekarang
                </button>
              </div>

              {/* Quick Demo Credentials Autofill Widget */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/80 shadow-inner space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <span className="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">DEMO</span>
                  <span className="font-bold text-slate-800 text-[11px]">Kredensial Akses Uji Coba:</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Customer Demo Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('budi@gmail.com');
                      setLoginPassword('user123');
                      setLoginIsAdmin(false);
                      setLoginError('');
                    }}
                    className="p-2.5 bg-white hover:bg-blue-50/50 border border-slate-150 rounded-xl text-left transition-all active:scale-95 group shadow-sm"
                  >
                    <p className="font-extrabold text-[10px] text-blue-600 group-hover:text-blue-700 uppercase tracking-wider mb-0.5">Portal Pelanggan</p>
                    <p className="text-[11px] text-slate-700 font-medium">budi@gmail.com</p>
                    <p className="text-[10px] text-slate-400 font-mono">Password: user123</p>
                    <span className="inline-block mt-1.5 text-[9px] text-blue-500 font-bold group-hover:underline">Klik Autofill &rarr;</span>
                  </button>

                  {/* Admin Demo Option */}
                  <button
                    type="button"
                    onClick={() => {
                      const adminEmail = `admin@${(companySettings.name || 'taranet').toLowerCase().replace(/\s+/g, '')}.id`;
                      setLoginEmail(adminEmail);
                      setLoginPassword('admin');
                      setLoginIsAdmin(true);
                      setLoginError('');
                    }}
                    className="p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-150 rounded-xl text-left transition-all active:scale-95 group shadow-sm"
                  >
                    <p className="font-extrabold text-[10px] text-indigo-600 group-hover:text-indigo-700 uppercase tracking-wider mb-0.5">Portal Admin</p>
                    <p className="text-[11px] text-slate-700 font-medium">admin@{(companySettings.name || 'taranet').toLowerCase().replace(/\s+/g, '')}.id</p>
                    <p className="text-[10px] text-slate-400 font-mono">Password: admin</p>
                    <span className="inline-block mt-1.5 text-[9px] text-indigo-500 font-bold group-hover:underline">Klik Autofill &rarr;</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'customer-dashboard' && currentUser && !('isAdmin' in currentUser) && (
            <motion.div
              key="customer-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <CustomerDashboard
                user={currentUser as CustomerUser}
                onRefreshUser={async () => {
                  await fetchCustomerProfile((currentUser as CustomerUser).id);
                }}
                onLogout={handleLogout}
                companyName={companySettings.name}
                logoUrl={companySettings.logoUrl}
                tagline={companySettings.tagline}
                billingDate={companySettings.billingDate}
                contactPhone={companySettings.contactPhone}
              />
            </motion.div>
          )}

          {currentPage === 'admin-dashboard' && currentUser && 'isAdmin' in currentUser && currentUser.isAdmin && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <AdminDashboard
                customers={adminCustomers}
                supportTickets={adminSupportTickets}
                onRefreshData={fetchAdminData}
                onUpdateCustomerStatus={handleUpdateCustomerStatus}
                onVerifyPayment={handleVerifyPayment}
                onRejectPayment={handleRejectPayment}
                whatsappLogs={adminWhatsappLogs}
                companySettings={companySettings}
                onUpdateCompanySettings={handleUpdateCompanySettings}
                packages={packages}
                onRefreshPackages={fetchPackages}
              />
            </motion.div>
          )}

          {currentPage === 'privacy-policy' && (
            <motion.div
              key="privacy-policy"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <PrivacyPolicy
                onNavigate={setCurrentPage}
                companyName={companySettings.name}
                contactPhone={companySettings.contactPhone}
              />
            </motion.div>
          )}

          {currentPage === 'terms-conditions' && (
            <motion.div
              key="terms-conditions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <TermsConditions
                onNavigate={setCurrentPage}
                companyName={companySettings.name}
                contactPhone={companySettings.contactPhone}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer
        onNavigate={setCurrentPage}
        companyName={companySettings.name}
        logoUrl={companySettings.logoUrl}
        tagline={companySettings.tagline}
        companyAddress={companySettings.address}
        contactPhone={companySettings.contactPhone}
      />
    </div>
  );
}
