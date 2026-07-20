import React from 'react';
import { ArrowLeft, Scale, BookOpen, AlertOctagon, HelpCircle, Landmark, Wifi } from 'lucide-react';

interface TermsConditionsProps {
  onNavigate: (page: string) => void;
  companyName?: string;
  contactPhone?: string;
}

export default function TermsConditions({ onNavigate, companyName = 'Taranet WiFi', contactPhone }: TermsConditionsProps) {
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
                <Scale className="w-7 h-7 text-blue-600 shrink-0" />
                Syarat dan Ketentuan
              </h1>
              <p className="text-xs text-slate-400">Terakhir diperbarui: 20 Juli 2026</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl shrink-0 h-fit max-w-xs">
              <p className="font-bold text-xs text-blue-800">Perjanjian Berlangganan</p>
              <p className="text-[10px] text-blue-600 leading-relaxed mt-1">
                Harap baca dokumen ini dengan seksama sebelum melakukan pendaftaran dan menyetujui kontrak berlangganan.
              </p>
            </div>
          </div>

          {/* Intro */}
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 text-xs sm:text-sm">
            <p>
              Perjanjian Syarat dan Ketentuan Berlangganan ini mengatur hubungan hukum antara Anda selaku <strong>Pelanggan</strong> dan <strong>{currentCompany}</strong> selaku penyedia jasa layanan internet serat optik (FTTH).
            </p>
            <p>
              Dengan menekan tombol kirim pendaftaran pada formulir berlangganan atau dengan melakukan pembayaran tagihan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tertulis di bawah ini tanpa pengecualian.
            </p>
          </div>

          {/* Section Grid */}
          <div className="space-y-6">
            {/* Section 1 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Wifi className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                1. Ketentuan Umum Layanan & Bandwidth
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li>Layanan kami disalurkan 100% menggunakan jaringan kabel serat optik (Fiber to the Home) murni langsung ke titik pelanggan.</li>
                <li>Kecepatan internet yang diterima diatur berdasarkan paket layanan yang Anda pilih. Kecepatan bandwidth bersifat <strong className="text-slate-800">"Up To" (hingga)</strong> dan dapat bervariasi bergantung pada jumlah perangkat aktif yang digunakan, jarak dari router, serta performa perangkat keras Anda.</li>
                <li>Layanan kami bersifat <strong className="text-slate-800">True Unlimited</strong> tanpa FUP (Fair Usage Policy). Kami tidak akan menurunkan kecepatan koneksi Anda setelah pemakaian batas gigabyte tertentu.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                2. Persyaratan Pendaftaran Baru
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li>Pendaftar wajib berusia minimal 17 tahun dan melampirkan salinan foto KTP yang sah dan valid di dalam formulir pendaftaran portal.</li>
                <li>Pelanggan wajib menandai titik lokasi pemasangan secara akurat pada modul OpenStreetMap Leaflet yang disediakan di sistem pendaftaran kami guna pengecekan jangkauan tiang distribusi (ODN/FAT) terdekat oleh teknisi.</li>
                <li>Kami membebaskan <strong className="text-slate-800">Biaya Pemasangan Baru (Gratis Rp 0)</strong> di wilayah cakupan jaringan kami. Namun, apabila penarikan kabel drop core melebihi batas standar (maksimal 150 meter dari tiang terdekat), pelanggan mungkin akan dikenai biaya penambahan kabel yang disetujui bersama sebelum instalasi dilakukan.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Landmark className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                3. Mekanisme Tagihan, Harga & Pajak
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li><strong className="text-slate-800">Harga Termasuk Pajak:</strong> Seluruh harga paket layanan internet yang tertera pada brosur dan portal resmi kami adalah <strong className="text-slate-800">harga bersih (Net) yang sudah termasuk Pajak Pertambahan Nilai (PPN)</strong> serta iuran wajib lainnya. Pelanggan tidak akan dikenai biaya siluman tambahan pada tagihan bulanan.</li>
                <li>Tagihan bulanan akan diterbitkan setiap bulannya dan wajib dibayar sebelum tanggal jatuh tempo yang ditetapkan (e.g. tanggal 20 setiap bulannya).</li>
                <li>Pelanggan wajib melakukan konfirmasi pembayaran di portal pelanggan dengan mengunggah bukti transfer yang valid agar sistem billing dapat melakukan verifikasi kelayakan lunas.</li>
                <li><strong className="text-slate-800">Keterlambatan Pembayaran:</strong> Keterlambatan pembayaran yang melampaui tanggal jatuh tempo dapat mengakibatkan sistem kami melakukan <strong className="text-red-700 font-semibold">Isolir Jaringan / Suspensi Otomatis</strong> secara berkala tanpa pemberitahuan lisan terlebih dahulu sampai dengan pelunasan dilakukan.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4.5 h-4.5 text-red-600 shrink-0" />
                4. Pembatasan Penggunaan & Hak Cipta
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1.5 pl-2 text-xs">
                <li><strong className="text-red-700 font-bold">Dilarang Keras Melakukan Reselling:</strong> Pelanggan dilarang keras menjual kembali, membagikan ulang (sharing bandwidth) ke lingkungan luar di luar bangunan terdaftar, memancarkan kembali (RT/RW Net), atau memungut biaya atas akses internet kami ke pihak ketiga tanpa izin kerja sama tertulis yang sah dari PT. AMANUSA TELEMEDIA MAHARDHIKA. Pelanggaran atas klausul ini akan ditindak tegas berupa pemutusan kontrak sepihak dan denda administratif.</li>
                <li>Pelanggan dilarang menggunakan jaringan internet kami untuk aktivitas melanggar hukum, penipuan online, penyebaran pornografi, spamming, peretasan, pencurian data, atau merusak infrastruktur siber pihak lain.</li>
                <li>Router modem ONT dan perangkat STB yang disewa merupakan milik operasional perusahaan. Pelanggan wajib menjaga dan memelihara perangkat tersebut, serta mengembalikannya dalam keadaan utuh apabila berhenti berlangganan di kemudian hari.</li>
              </ul>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900">Pertanyaan & Bantuan Hukum</h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Apabila terdapat keraguan, sengketa, atau jika Anda ingin mengonfirmasi klausul hukum tertentu pada dokumen Syarat dan Ketentuan ini, silakan hubungi pusat operasional legal kami melalui customer service:
            </p>
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex flex-col sm:flex-row justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">Layanan Administrasi {currentCompany}</p>
                <p className="text-slate-500 mt-0.5">Telepon/WA: {contactPhone || '+62 899-3299-977'}</p>
              </div>
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-95 text-[11px]"
              >
                Hubungi Customer Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
