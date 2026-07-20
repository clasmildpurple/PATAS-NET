import { jsPDF } from 'jspdf';
import { CustomerUser, SupportTicket } from '../types';
import { PACKAGES } from '../components/Home';

export function generateCustomerPDFReport(user: CustomerUser, tickets: SupportTicket[] = [], companyName: string = 'Taranet WiFi') {
  const doc = new jsPDF();
  const userPkg = PACKAGES.find((p) => p.id === user.packageId) || { name: 'Unknown', speed: 'N/A', price: 0 };

  // Draw header border
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 40, 'F');

  // Header Content
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(companyName.toUpperCase(), 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Bulanan & Riwayat Layanan Pelanggan', 15, 30);
  doc.text(`ID Pelanggan: ${user.id}`, 155, 20);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 155, 26);

  // Bill To Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI PERSONAL PELANGGAN', 15, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Nama Lengkap   : ${user.name}`, 15, 63);
  doc.text(`Alamat Email   : ${user.email}`, 15, 69);
  doc.text(`No. Handphone  : ${user.phone}`, 15, 75);
  doc.text(`Alamat Pasang  : ${user.address}`, 15, 81);
  if (user.coordinates) {
    doc.text(`Titik Koordinat: ${user.coordinates[0].toFixed(6)}, ${user.coordinates[1].toFixed(6)}`, 15, 87);
  } else {
    doc.text(`Titik Koordinat: N/A`, 15, 87);
  }

  // Network stats mockup for the monthly report
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('IKHTISAR PENGGUNAAN DATA & LAYANAN', 15, 100);

  // Draw box for stats
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 105, 180, 28, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Paket Wifi Aktif    : ${userPkg.name}`, 20, 112);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bandwidth Internet  : ${userPkg.speed}`, 20, 118);
  doc.text(`SLA Ketersediaan    : 99.9% (Sangat Stabil)`, 20, 124);
  doc.text(`Total Konsumsi Data : 412.5 GB (True Unlimited - Tanpa FUP)`, 20, 130);

  // Billing Details Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RINCIAN TAGIHAN & RIWAYAT PEMBAYARAN', 15, 145);

  // Draw table headers
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 150, 180, 8, 'F');
  doc.setFontSize(8.5);
  doc.text('Periode', 18, 155);
  doc.text('Jumlah', 55, 155);
  doc.text('Metode', 90, 155);
  doc.text('ID Transaksi', 125, 155);
  doc.text('Status', 170, 155);

  let yOffset = 164;
  doc.setFont('helvetica', 'normal');
  user.payments.forEach((pm) => {
    if (yOffset > 270) {
      doc.addPage();
      yOffset = 20;
    }
    doc.text(pm.billingPeriod, 18, yOffset);
    doc.text(`Rp ${pm.amount.toLocaleString('id-ID')}`, 55, yOffset);
    doc.text(pm.method?.toUpperCase() || 'QRIS', 90, yOffset);
    doc.text(pm.transactionId || 'N/A', 125, yOffset);
    
    // Status text colors
    if (pm.status === 'paid') {
      doc.setTextColor(16, 185, 129); // Green
      doc.text('LUNAS', 170, yOffset);
    } else if (pm.status === 'pending_verification') {
      doc.setTextColor(245, 158, 11); // Amber
      doc.text('VERIFIKASI', 170, yOffset);
    } else {
      doc.setTextColor(239, 68, 68); // Red
      doc.text('BELUM BAYAR', 170, yOffset);
    }
    doc.setTextColor(71, 85, 105);
    yOffset += 8;
  });

  // Service History Table
  yOffset += 10;
  if (yOffset > 240) {
    doc.addPage();
    yOffset = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('RIWAYAT TIKET GANGGUAN / DUKUNGAN TEKNIS', 15, yOffset);
  yOffset += 5;

  // Draw table headers
  doc.setFillColor(241, 245, 249);
  doc.rect(15, yOffset, 180, 8, 'F');
  doc.setFontSize(8.5);
  doc.text('ID Tiket', 18, yOffset + 5);
  doc.text('Tanggal Lapor', 45, yOffset + 5);
  doc.text('Pesan Keluhan', 80, yOffset + 5);
  doc.text('Status', 170, yOffset + 5);
  yOffset += 13;

  doc.setFont('helvetica', 'normal');
  const userTickets = tickets.length > 0 ? tickets : (user.tickets || []);
  if (userTickets.length === 0) {
    doc.text('Tidak ada catatan keluhan teknis / laporan gangguan.', 18, yOffset);
    yOffset += 8;
  } else {
    userTickets.forEach((t) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
      doc.text(t.id, 18, yOffset);
      doc.text(t.date.split(' ')[0], 45, yOffset);
      
      // Truncate message if too long
      const msg = t.message.length > 45 ? t.message.substring(0, 45) + '...' : t.message;
      doc.text(msg, 80, yOffset);

      if (t.status === 'resolved') {
        doc.setTextColor(16, 185, 129);
        doc.text('SELESAI', 170, yOffset);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('AKTIF', 170, yOffset);
      }
      doc.setTextColor(71, 85, 105);
      yOffset += 8;
    });
  }

  // Footer info
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen laporan ini diterbitkan secara otomatis oleh sistem administrasi terpadu ${companyName.toUpperCase()}.`, 15, 280);
  doc.text('Segala bentuk data yang tercantum bersifat rahasia dan sah bagi pelanggan terdaftar.', 15, 285);

  const cleanCompanyName = companyName.replace(/\s+/g, '_');
  doc.save(`Laporan_Bulanan_${cleanCompanyName}_${user.name.replace(/\s+/g, '_')}_${user.id}.pdf`);
}

export function generateAdminMonthlyPDFReport(
  customers: CustomerUser[],
  tickets: SupportTicket[] = [],
  companyName: string = 'Taranet WiFi'
) {
  const doc = new jsPDF();
  
  // Calculate total statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const pendingCustomers = customers.filter(c => c.status === 'pending').length;
  
  let totalRevenue = 0;
  let pendingRevenue = 0;
  let transactionCount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  
  customers.forEach(c => {
    c.payments.forEach(p => {
      transactionCount++;
      if (p.status === 'paid') {
        totalRevenue += p.amount;
        paidCount++;
      } else if (p.status === 'pending_verification') {
        pendingRevenue += p.amount;
        pendingCount++;
      }
    });
  });

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status !== 'resolved').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  // Draw header border (Teal/Slate elegant style)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 42, 'F');

  // Header Content
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(companyName.toUpperCase(), 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN BULANAN KINERJA OPERASIONAL & KEUANGAN', 15, 30);
  doc.text(`Tipe Dokumen: Laporan Eksekutif`, 140, 20);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 140, 26);
  doc.text(`Jumlah Pelanggan: ${totalCustomers} Orang`, 140, 32);

  // Business Performance Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('I. METRIK KINERJA & KEUANGAN WiFi', 15, 55);

  // Quick Stats Grid - Draw Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 60, 180, 32, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PENDAPATAN BERSIH (LUNAS):', 20, 68);
  doc.setTextColor(22, 163, 74); // green-600
  doc.setFontSize(11);
  doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, 20, 75);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('PENDAPATAN PENDING VERIFIKASI:', 110, 68);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.setFontSize(11);
  doc.text(`Rp ${pendingRevenue.toLocaleString('id-ID')}`, 110, 75);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status Pelanggan: ${activeCustomers} Aktif, ${pendingCustomers} Menunggu`, 20, 85);
  doc.text(`Status Tiket Laporan Gangguan: ${openTickets} Aktif / ${resolvedTickets} Selesai`, 110, 85);

  // Detailed Transaction List Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('II. RINCIAN TRANSAKSI AKTIF DAN VERIFIKASI TERBARU', 15, 105);

  // Draw table headers
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 110, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Pelanggan', 18, 115);
  doc.text('No HP', 60, 115);
  doc.text('Periode', 95, 115);
  doc.text('Jumlah Bayar', 130, 115);
  doc.text('Status', 170, 115);

  let yOffset = 124;
  doc.setFont('helvetica', 'normal');
  
  // Collect all payments
  const allPayments: { customerName: string; phone: string; billingPeriod: string; amount: number; status: string }[] = [];
  customers.forEach(c => {
    c.payments.forEach(p => {
      allPayments.push({
        customerName: c.name,
        phone: c.phone,
        billingPeriod: p.billingPeriod,
        amount: p.amount,
        status: p.status
      });
    });
  });

  // Sort payments to show paid/pending first
  allPayments.sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === 'pending_verification') return -1;
    if (b.status === 'pending_verification') return 1;
    if (a.status === 'paid') return -1;
    return 1;
  });

  if (allPayments.length === 0) {
    doc.text('Belum ada riwayat transaksi pendaftaran/pembayaran pelanggan.', 18, yOffset);
    yOffset += 8;
  } else {
    allPayments.slice(0, 18).forEach((p) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
      doc.text(p.customerName.length > 22 ? p.customerName.substring(0, 22) + '...' : p.customerName, 18, yOffset);
      doc.text(p.phone, 60, yOffset);
      doc.text(p.billingPeriod, 95, yOffset);
      doc.text(`Rp ${p.amount.toLocaleString('id-ID')}`, 130, yOffset);
      
      if (p.status === 'paid') {
        doc.setTextColor(22, 163, 74);
        doc.text('LUNAS', 170, yOffset);
      } else if (p.status === 'pending_verification') {
        doc.setTextColor(217, 119, 6);
        doc.text('VERIFIKASI', 170, yOffset);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text('BELUM BAYAR', 170, yOffset);
      }
      doc.setTextColor(71, 85, 105);
      yOffset += 8;
    });
  }

  // Footer info
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen laporan operasional & keuangan bulanan ini digenerate secara otomatis oleh sistem ${companyName.toUpperCase()}.`, 15, 280);
  doc.text('Data bersifat akurat & sinkron secara real-time berdasarkan aktivitas administrasi di lapangan.', 15, 285);

  const cleanCompanyName = companyName.replace(/\s+/g, '_');
  doc.save(`Laporan_Bulanan_Admin_${cleanCompanyName}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
}
