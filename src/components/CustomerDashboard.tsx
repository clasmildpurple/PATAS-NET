import React, { useState } from 'react';
import { Wifi, CreditCard, Download, Send, AlertCircle, CheckCircle, FileText, Upload, Calendar, ArrowRight, User, MapPin, LogOut, RefreshCw, Star, MessageSquare } from 'lucide-react';
import { CustomerUser, PaymentRecord } from '../types';
import { PACKAGES } from './Home';
import { jsPDF } from 'jspdf';
import { generateCustomerPDFReport } from '../lib/pdfGenerator';
import Logo from './Logo';
import { replaceCompanyText } from '../lib/branding';

interface CustomerDashboardProps {
  user: CustomerUser;
  onRefreshUser: () => void;
  onLogout: () => void;
  companyName?: string;
  logoUrl?: string;
  tagline?: string;
  billingDate?: number;
  contactPhone?: string;
}

export default function CustomerDashboard({ user, onRefreshUser, onLogout, companyName, logoUrl, tagline, billingDate, contactPhone }: CustomerDashboardProps) {
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Payment states
  const [activeTab, setActiveTab] = useState<'home' | 'bayar' | 'bantuan' | 'testimoni'>('home');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [proofImage, setProofImage] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Testimonial states
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialTag, setTestimonialTag] = useState('INTERNET KENCANG');
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [testimonialSuccess, setTestimonialSuccess] = useState(false);

  // Get current package
  const userPkgRaw = PACKAGES.find((p) => p.id === user.packageId) || PACKAGES[0];
  const userPkg = {
    ...userPkgRaw,
    name: replaceCompanyText(userPkgRaw.name, companyName),
  };

  const handleSupportTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    setSubmittingTicket(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          email: user.email,
          phone: user.phone,
          message: ticketMessage,
        })
      });

      if (response.ok) {
        setTicketSuccess(true);
        setTicketMessage('');
      } else {
        alert('Gagal mengirimkan laporan gangguan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialText.trim()) return;

    setSubmittingTestimonial(true);
    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          role: 'Pelanggan Aktif',
          location: user.address.split(',')[0] || 'Kecamatan Terdaftar',
          rating: testimonialRating,
          text: testimonialText,
          tag: testimonialTag,
          customerId: user.id
        })
      });

      if (response.ok) {
        setTestimonialSuccess(true);
      } else {
        alert('Gagal mengirimkan testimoni.');
      }
    } catch (err) {
      console.error('Error submitting testimonial:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  // Process Mock Payment Proof
  const handleProofOfPaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !proofImage) return;

    setSubmittingPayment(true);
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          paymentId: selectedPayment.id,
          method: paymentMethod,
          proofOfPaymentUrlBase64: proofImage,
        })
      });

      if (response.ok) {
        setPaymentSuccess(true);
        setProofImage('');
        setSelectedPayment(null);
        onRefreshUser(); // Refresh user object to show updated pending state
      } else {
        alert('Gagal mengirim bukti pembayaran.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Automatic PDF Monthly Report Generator using jsPDF
  const handleDownloadPDFReport = (payment: PaymentRecord) => {
    const doc = new jsPDF();

    // Draw header border
    doc.setFillColor(30, 41, 59); // Dark blue / Slate-800
    doc.rect(0, 0, 210, 40, 'F');

    // Header Content
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text((companyName || 'Taranet').toUpperCase() + ' WIFI', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Tagihan Bulanan & Kuitansi Pembayaran', 15, 30);
    doc.text(`Periode: ${payment.billingPeriod}`, 155, 20);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 155, 26);

    // Bill To Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI PELANGGAN', 15, 55);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Nama Pelanggan  : ${user.name}`, 15, 63);
    doc.text(`Email Pelanggan : ${user.email}`, 15, 69);
    doc.text(`No. Handphone   : ${user.phone}`, 15, 75);
    doc.text(`Alamat Pasang   : ${user.address}`, 15, 81);

    // Network stats mockup for the monthly report
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DETAIL LAYANAN & STATISTIK BULANAN', 15, 95);

    // Draw box for stats
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 100, 180, 28, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Paket Wifi Terpilih : ${userPkg.name}`, 20, 107);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bandwidth Internet  : ${userPkg.speed}`, 20, 113);
    doc.text(`SLA Ketersediaan    : 99.9% (Sangat Stabil)`, 20, 119);
    doc.text(`Total Konsumsi Data : 412.5 GB (Tanpa FUP / True Unlimited)`, 20, 125);

    // Pricing details table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RINCIAN TAGIHAN', 15, 140);

    // Table headers
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 145, 180, 8, 'F');
    doc.setFontSize(9);
    doc.text('Deskripsi Layanan', 20, 150);
    doc.text('Harga', 165, 150);

    // Table body
    doc.setFont('helvetica', 'normal');
    doc.text(`Biaya Berlangganan Paket Wifi - ${userPkg.name}`, 20, 160);
    doc.text(`Rp ${userPkg.price.toLocaleString('id-ID')}`, 165, 160);

    const rentStbAmount = payment.amount - userPkg.price;
    if (rentStbAmount > 0) {
      doc.text('Sewa Android STB Smart Box untuk TV', 20, 168);
      doc.text(`Rp ${rentStbAmount.toLocaleString('id-ID')}`, 165, 168);
    }

    doc.line(15, 175, 195, 175);

    // Table total
    doc.setFont('helvetica', 'bold');
    doc.text('Total Tagihan Terbayar:', 20, 182);
    doc.text(`Rp ${payment.amount.toLocaleString('id-ID')}`, 165, 182);

    // Status Stamp
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(20, 184, 166);
    doc.rect(15, 192, 180, 16, 'FD');
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(10);
    doc.text(`STATUS TRANSAKSI: LUNAS (PAID) - METODE: ${payment.method?.toUpperCase() || 'QRIS'}`, 25, 202);

    // Footer info
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Kuitansi ini diterbitkan secara sah oleh sistem tagihan otomatis ${(companyName || 'Taranet').toUpperCase()} WIFI.`, 15, 260);
    doc.text('Hubungi layanan pelanggan kami 24 jam apabila memiliki kendala atau keluhan teknis.', 15, 265);

    doc.save(`Tagihan_${(companyName || 'Taranet').replace(/\s+/g, '_')}_${user.name.replace(/\s+/g, '_')}_${payment.billingPeriod.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 flex flex-col md:flex-row gap-6 sm:gap-8 text-xs relative min-h-screen">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-700 rounded-3xl border border-slate-200/80 shrink-0 md:sticky md:top-28 md:self-start h-[calc(100vh-160px)] shadow-md overflow-y-auto z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <Logo inverse={false} companyName={companyName} logoUrl={logoUrl} tagline={tagline} />
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            type="button"
            onClick={() => { setActiveTab('home'); setSelectedPayment(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'home'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15 font-extrabold'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <Wifi className="w-4 h-4 shrink-0" />
            <span>Detail Layanan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bayar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all relative ${
              activeTab === 'bayar'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15 font-extrabold'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Menu Bayar / Tagihan</span>
            {user.payments.some(p => p.status === 'unpaid') && (
              <span className="absolute top-3.5 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bantuan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'bantuan'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15 font-extrabold'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Bantuan & Kendala</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('testimoni')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'testimoni'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15 font-extrabold'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Kirim Testimoni</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Mobile Header */}
        <header className="md:hidden bg-white text-slate-900 p-4 flex items-center justify-between shadow border-b border-slate-100">
          <Logo inverse={false} companyName={companyName} logoUrl={logoUrl} tagline={tagline} />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full">
            <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] font-bold text-slate-700">{user.status === 'active' ? 'Aktif' : 'Proses'}</span>
          </div>
        </header>

        {/* Content Container */}
        <div className="w-full space-y-6 md:space-y-8 pb-24 md:pb-10">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl" />

            <div className="space-y-2">
              <span className="px-3 py-1 bg-yellow-400 text-slate-950 font-extrabold text-[9px] rounded-full uppercase tracking-wider">
                PORTAL PELANGGAN {(companyName || 'TARANET').toUpperCase()}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Selamat Datang, {user.name}!</h1>
              <p className="text-xs text-blue-200">Kelola paket, periksa pembayaran bulanan Anda, dan dapatkan bantuan cepat di sini.</p>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl w-full sm:w-auto shrink-0">
              <div className="p-2.5 bg-blue-600/30 rounded-xl text-yellow-400 shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] text-blue-300 font-bold uppercase tracking-wider">Status Koneksi Anda</p>
                <p className="font-extrabold text-xs flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {user.status === 'active' ? 'Aktif (Koneksi Stabil)' : 'Menunggu Pemasangan'}
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT SWITCH PANEL BASED ON ACTIVE TAB */}
          <div className="space-y-8">
        
        {/* TAB 1: SERVICE DETAIL / HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Detail Paket Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-1 border-b border-slate-100 gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Detail Paket WiFi Anda
                </h3>
                <button
                  type="button"
                  onClick={() => generateCustomerPDFReport(user, [], companyName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] transition-all shadow-sm active:scale-95 text-center self-start"
                  title="Unduh Laporan Bulanan Lengkap (PDF)"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Laporan Bulanan (PDF)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nama Paket</span>
                  <p className="font-extrabold text-sm text-slate-900">{userPkg.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kecepatan Internet</span>
                  <p className="font-black text-sm text-blue-600 font-mono">{userPkg.speed}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tarif Bulanan</span>
                  <p className="font-extrabold text-sm text-slate-900">
                    Rp {userPkg.price.toLocaleString('id-ID')} / bulan
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3 mt-4 text-xs text-slate-600">
                <MapPin className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Titik Pasang Terdaftar:</span>
                  <p className="text-[11px] mt-0.5 text-slate-500 leading-relaxed">{user.address}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Koordinat GPS: {user.coordinates[0].toFixed(6)}, {user.coordinates[1].toFixed(6)}</p>
                </div>
              </div>

              {/* Upgrade Info Notice */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-850 font-bold text-[9px] rounded uppercase tracking-wider">Upgrade / Ganti Paket</span>
                  <p className="text-xs text-slate-850 font-bold">Ingin meningkatkan kecepatan internet Anda?</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Perubahan atau upgrade paket WiFi hanya dapat diproses oleh administrator. Silakan hubungi kami melalui menu Bantuan atau WhatsApp untuk proses instan tanpa biaya registrasi tambahan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bantuan')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
                >
                  Hubungi Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU BAYAR (BILLING & PAYMENTS) */}
        {activeTab === 'bayar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            {/* Billing List */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Riwayat Tagihan & Pembayaran
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-0.5 rounded-lg font-extrabold">
                    Jatuh Tempo: Tgl {billingDate || 20} setiap bulan
                  </span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg font-extrabold">Auto-Generated</span>
                </div>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Periode</th>
                      <th className="py-3 px-4">Jumlah Tagihan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {user.payments.map((pm) => (
                      <tr key={pm.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {pm.billingPeriod}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          Rp {pm.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1.0 rounded-full font-bold text-[10px] uppercase border ${
                            pm.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : pm.status === 'pending_verification'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {pm.status === 'paid' ? 'Lunas' : pm.status === 'pending_verification' ? 'Proses Verifikasi' : 'Belum Dibayar'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {pm.status === 'unpaid' && (
                            <button
                              onClick={() => {
                                setSelectedPayment(pm);
                                setPaymentSuccess(false);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] transition-all active:scale-95 shadow-sm"
                            >
                              Bayar Sekarang
                            </button>
                          )}
                          {pm.status === 'paid' && (
                            <button
                              onClick={() => handleDownloadPDFReport(pm)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg font-bold text-[10px] transition-all border border-slate-200/80"
                              title="Unduh PDF Kuitansi Tagihan"
                            >
                              <Download className="w-3 h-3" /> PDF Kuitansi
                            </button>
                          )}
                          {pm.status === 'pending_verification' && (
                            <span className="text-[10px] text-slate-400 italic">Menunggu verifikasi admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Portal Pembayaran */}
            <div className="lg:col-span-4 space-y-6">
              {selectedPayment ? (
                <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-900">Portal Pembayaran</h4>
                    <button
                      onClick={() => {
                        setSelectedPayment(null);
                        setProofImage('');
                      }}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="space-y-1 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tagihan Periode</span>
                    <p className="font-extrabold text-sm text-slate-900">{selectedPayment.billingPeriod}</p>
                    <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-blue-100/50">
                      <span className="font-bold text-slate-600">Total Pembayaran:</span>
                      <span className="font-black text-sm text-blue-600 font-mono">Rp {selectedPayment.amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">METODE PEMBAYARAN *</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold text-xs text-slate-800"
                      >
                        <option value="qris">QRIS (OVO, GoPay, Dana, LinkAja - Instan)</option>
                        <option value="bca">Transfer Bank BCA - 1234567890 a/n PT Amanusa</option>
                        <option value="mandiri">Transfer Bank Mandiri - 9876543210 a/n PT Amanusa</option>
                        <option value="stripe">Kartu Kredit / Internasional (Stripe-secured)</option>
                        <option value="paypal">PayPal (internasional)</option>
                      </select>
                    </div>

                    {paymentMethod === 'qris' && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-2">
                        <p className="font-bold text-[11px] text-slate-700">Scan QRIS Untuk Melakukan Pembayaran</p>
                        {/* Mock QR code design using standard box */}
                        <div className="w-32 h-32 bg-slate-900 mx-auto rounded-lg border-4 border-white shadow-md flex items-center justify-center text-white p-2">
                          <div className="border border-white/20 w-full h-full flex flex-col items-center justify-center font-bold font-mono text-[8px] uppercase tracking-widest text-center leading-tight">
                            <span>QRIS CODE</span>
                            <span>MOCKUP</span>
                            <span>{(companyName || 'Taranet').toUpperCase()}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Scan menggunakan aplikasi mobile banking atau e-wallet pilihan Anda.</p>
                      </div>
                    )}

                    {/* Upload proof of payment */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">UNGGAH BUKTI TRANSAKSI *</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofOfPaymentUpload}
                          className="hidden"
                          id="proof-upload-input"
                          required
                        />
                        {proofImage ? (
                          <div className="space-y-2">
                            <img src={proofImage} alt="Bukti Transfer" className="h-20 object-contain rounded border border-slate-200 mx-auto" />
                            <button
                              type="button"
                              onClick={() => setProofImage('')}
                              className="text-[10px] text-red-500 font-bold hover:underline"
                            >
                              Hapus Bukti
                            </button>
                          </div>
                        ) : (
                          <label htmlFor="proof-upload-input" className="cursor-pointer space-y-1.5 flex flex-col items-center py-2">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="font-bold text-slate-600 block text-[10px]">Pilih Foto Resi Bukti Transfer</span>
                          </label>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="confirm-payment-btn"
                      disabled={submittingPayment}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      {submittingPayment ? 'Mengirim Bukti...' : 'Konfirmasi & Kirim Bukti'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 text-slate-500">
                  <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-xs">Instruksi Pembayaran</p>
                  <p className="text-[10px] leading-relaxed">Silakan pilih salah satu tagihan Anda di tabel sebelah kiri dan klik tombol <strong className="text-blue-600">Bayar Sekarang</strong> untuk memuat detail QRIS/rekening bank dan menyelesaikan pembayaran.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HELP / TROUBLE TICKET */}
        {activeTab === 'bantuan' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" /> Laporkan Kendala Koneksi
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika WiFi Anda lambat, mati, atau router LOS lampu merah menyala, segera kirim laporan kendala di bawah ini. Tim teknisi kami akan segera meninjau tiket laporan Anda.
            </p>

            {ticketSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-emerald-900 text-xs">Laporan Kendala Terkirim!</p>
                <p className="text-[10px] text-slate-500">Tiket kendala #T-{Math.floor(1000 + Math.random() * 9000)} telah dibuat. Teknisi kami akan merespon via WhatsApp Anda dalam maks. 30 menit.</p>
                <button
                  onClick={() => setTicketSuccess(false)}
                  className="px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded font-semibold text-[10px]"
                >
                  Buat Laporan Baru
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportTicketSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="ticket-desc">DESKRIPSI GANGGUAN *</label>
                  <textarea
                    id="ticket-desc"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Misal: Lampu LOS Router menyala merah kedip-kedip, internet terputus sejak jam 9 pagi..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none h-24 resize-none bg-slate-50/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  id="ticket-submit-btn"
                  disabled={submittingTicket}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Tiket Laporan Teknis
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: TESTIMONIAL FORM */}
        {activeTab === 'testimoni' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" /> Berikan Testimoni Anda
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pengalaman Anda sangat berharga bagi kami! Berikan ulasan atau kepuasan Anda dalam menggunakan layanan internet kami. Testimoni Anda akan langsung ditampilkan di halaman beranda website.
            </p>

            {testimonialSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-emerald-900 text-xs">Testimoni Berhasil Dikirim!</p>
                <p className="text-[10px] text-slate-500">Terima kasih banyak atas dukungan dan feedback jujur Anda. Ulasan Anda sekarang tayang di halaman depan website.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTestimonialSuccess(false);
                    setTestimonialText('');
                  }}
                  className="px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded font-semibold text-[10px]"
                >
                  Kirim Testimoni Lainnya
                </button>
              </div>
            ) : (
              <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-[10px] uppercase tracking-wider">Rating Penilaian</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTestimonialRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= testimonialRating
                              ? 'text-yellow-500 fill-yellow-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase tracking-wider">Kategori Testimoni</label>
                  <select
                    value={testimonialTag}
                    onChange={(e) => setTestimonialTag(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 font-medium"
                  >
                    <option value="INTERNET KENCANG">INTERNET KENCANG</option>
                    <option value="SANGAT STABIL">SANGAT STABIL</option>
                    <option value="LAYANAN MEMUASKAN">LAYANAN MEMUASKAN</option>
                    <option value="HARGA BERSAHABAT">HARGA BERSAHABAT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase tracking-wider" htmlFor="testimonial-text">Ulasan / Testimoni Anda *</label>
                  <textarea
                    id="testimonial-text"
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
                    placeholder="Tuliskan pengalaman Anda menggunakan internet kami. Misal: Koneksi kencang tanpa FUP, CS ramah dan teknisi gercep!"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none bg-slate-50/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTestimonial}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingTestimonial ? 'Mengirim...' : 'Kirim Testimoni ke Beranda'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  </main>

  {/* Mobile Bottom Navigation Bar - Sticky at bottom of viewport */}
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 py-2.5 px-4 flex justify-around items-center">
    <button
      type="button"
      onClick={() => { setActiveTab('home'); setSelectedPayment(null); }}
      className={`flex flex-col items-center gap-1 text-center font-bold transition-all ${
        activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Wifi className="w-5 h-5" />
      <span className="text-[9px]">Layanan</span>
    </button>
    
    <button
      type="button"
      onClick={() => setActiveTab('bayar')}
      className={`flex flex-col items-center gap-1 text-center font-bold relative transition-all ${
        activeTab === 'bayar' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <CreditCard className="w-5 h-5" />
      <span className="text-[9px]">Bayar</span>
      {user.payments.some(p => p.status === 'unpaid') && (
        <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </button>

    <button
      type="button"
      onClick={() => setActiveTab('bantuan')}
      className={`flex flex-col items-center gap-1 text-center font-bold transition-all ${
        activeTab === 'bantuan' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <AlertCircle className="w-5 h-5" />
      <span className="text-[9px]">Bantuan</span>
    </button>

    <button
      type="button"
      onClick={() => setActiveTab('testimoni')}
      className={`flex flex-col items-center gap-1 text-center font-bold transition-all ${
        activeTab === 'testimoni' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <MessageSquare className="w-5 h-5" />
      <span className="text-[9px]">Testimoni</span>
    </button>
  </div>
    </div>
  );
}
