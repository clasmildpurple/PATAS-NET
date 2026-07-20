import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { replaceCompanyText } from '../lib/branding';

interface PrivacyPolicyProps {
  onNavigate: (page: string) => void;
  companyName?: string;
  contactPhone?: string;
}

export default function PrivacyPolicy({ onNavigate, companyName = 'Taranet WiFi', contactPhone }: PrivacyPolicyProps) {
  const currentCompany = companyName;

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-3" />

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold hover:underline mb-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Shield className="w-7 h-7 text-blue-600 shrink-0" />
                Kebijakan Privasi
              </h1>
              <p className="text-xs text-slate-400">Terakhir diperbarui: 20 Juli 2026</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl shrink-0 h-fit max-w-xs">
              <p className="font-bold text-xs text-blue-800">Komitmen Keamanan</p>
              <p className="text-[10px] text-blue-600 leading-relaxed mt-1">
                Kami sangat menghargai privasi Anda dan menjamin keamanan seluruh informasi pribadi pelanggan.
              </p>
            </div>
          </div>

          {/* Intro */}
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 text-xs sm:text-sm">
            <p>
              Selamat datang di halaman Kebijakan Privasi <strong>{currentCompany}</strong>. Privasi Anda sangat penting bagi kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda mendaftar, berlangganan, atau berinteraksi dengan layanan internet serat optik kami.
            </p>
            <p>
              Dengan mengakses situs web ini dan mendaftarkan diri Anda sebagai pelanggan kami, Anda menyetujui praktik pengumpulan dan penggunaan informasi sebagaimana dijelaskan dalam Kebijakan Privasi ini.
            </p>
          </div>

          {/* Section Grid */}
          <div className="space-y-6">
            {/* Section 1 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                1. Informasi yang Kami Kumpulkan
              </h3>
              <p className="text-slate-600 leading-relaxed text-xs">
                Kami mengumpulkan informasi pribadi yang Anda berikan secara langsung ketika mendaftar layanan baru, antara lain:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li><strong className="text-slate-800">Identitas Diri:</strong> Nama lengkap, alamat email aktif, dan nomor handphone (WhatsApp).</li>
                <li><strong className="text-slate-800">Alamat Pemasangan:</strong> Alamat lengkap rumah/bisnis tempat instalasi jaringan fiber optik dilakukan.</li>
                <li><strong className="text-slate-800">Koordinat Geografis:</strong> Titik koordinat lokasi peta (latitude & longitude) yang Anda pilih pada OpenStreetMap guna mempermudah survei jalur oleh tim teknisi.</li>
                <li><strong className="text-slate-800">Foto KTP:</strong> Salinan foto kartu identitas (KTP) sebagai validasi legalitas kepemilikan jaringan internet dan pencegahan penipuan.</li>
                <li><strong className="text-slate-800">Informasi Pembayaran:</strong> Metode pembayaran, nilai transfer, dan salinan bukti transfer (bukti pembayaran tagihan bulanan).</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                2. Penggunaan Informasi Anda
              </h3>
              <p className="text-slate-600 leading-relaxed text-xs">
                Kami menggunakan data pribadi yang kami kumpulkan untuk tujuan-tujuan berikut:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li>Memproses dan memvalidasi pendaftaran baru serta menyiapkan infrastruktur instalasi internet di lokasi Anda.</li>
                <li>Mengirimkan pemberitahuan resmi secara otomatis melalui sistem WhatsApp terintegrasi (seperti bukti pembayaran diterima, reminder tagihan, peringatan isolir, dan status perbaikan gangguan).</li>
                <li>Menghubungi Anda apabila terjadi gangguan teknis berskala wilayah atau adanya koordinasi kunjungan teknisi lapangan.</li>
                <li>Menerbitkan tagihan bulanan berkala dan memverifikasi kesesuaian bukti pembayaran Anda di portal pelanggan.</li>
                <li>Meningkatkan kualitas layanan pelanggan dan optimalisasi penjaluran internet serat optik kami.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Lock className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                3. Keamanan Informasi dan Enkripsi
              </h3>
              <p className="text-slate-600 leading-relaxed text-xs">
                Kami berkomitmen menjaga keamanan data Anda dengan menerapkan standar keamanan operasional yang tinggi:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li><strong className="text-slate-800">Hashing SHA256:</strong> Password akun portal pelanggan Anda dienkripsi secara aman menggunakan fungsi hash satu arah SHA256 sehingga tidak dapat dibaca oleh siapa pun, termasuk pihak manajemen internal kami.</li>
                <li><strong className="text-slate-800">Penyimpanan Terisolasi:</strong> Salinan foto KTP dan bukti pembayaran disimpan dalam direktori aman dan terenkripsi untuk mencegah kebocoran data di internet.</li>
                <li><strong className="text-slate-800">Perlindungan Akses:</strong> Akses ke data pribadi pelanggan dibatasi secara ketat hanya kepada staf administrasi dan teknisi resmi yang memegang otoritas valid.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                4. Hak-Hak Anda Atas Data Pribadi
              </h3>
              <p className="text-slate-600 leading-relaxed text-xs">
                Sebagai pemilik data yang sah, Anda memiliki kendali penuh atas informasi Anda di sistem kami:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li><strong className="text-slate-800">Akses Data:</strong> Anda dapat memeriksa keakuratan alamat, nomor telepon, dan riwayat pembayaran Anda secara langsung di portal pelanggan kapan saja.</li>
                <li><strong className="text-slate-800">Perubahan Data:</strong> Anda berhak mengajukan pembaruan data apabila ada perubahan nomor telepon, alamat email, atau melakukan ganti paket layanan.</li>
                <li><strong className="text-slate-800">Penghapusan Akun:</strong> Anda dapat mengajukan permohonan penutupan akun pelanggan secara permanen dan penghapusan riwayat file KTP dari database kami dengan mengajukan permohonan tertulis ke layanan pelanggan.</li>
              </ul>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900">Pertanyaan & Bantuan</h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Apabila Anda memiliki pertanyaan, keluhan, atau membutuhkan penjelasan lebih lanjut mengenai Kebijakan Privasi ini, jangan ragu untuk menghubungi Tim Customer Service kami yang aktif melayani Anda:
            </p>
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex flex-col sm:flex-row justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">Kontak Resmi CS {currentCompany}</p>
                <p className="text-slate-500 mt-0.5">Telepon/WA: {contactPhone || '+62 899-3299-977'}</p>
              </div>
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-95 text-[11px]"
              >
                Hubungi Kami Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
