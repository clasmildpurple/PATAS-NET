import React, { useState, useEffect } from 'react';
import {
  Database,
  Save,
  RefreshCw,
  Sliders,
  Users,
  ShieldCheck,
  FileJson,
  Key,
  LogOut,
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react';
import Logo from './Logo';

interface DeveloperDashboardProps {
  onLogout: () => void;
  companyName: string;
}

export default function DeveloperDashboard({ onLogout, companyName }: DeveloperDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings_override' | 'db_editor' | 'sheets_integration'>('overview');
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [appScriptUrl, setAppScriptUrl] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');

  // JSON editor draft strings
  const [jsonDrafts, setJsonDrafts] = useState<{
    customers: string;
    tickets: string;
    passwords: string;
    settings: string;
  }>({
    customers: '',
    tickets: '',
    passwords: '',
    settings: ''
  });

  // Simple form state for setting overrides
  const [overrideSettings, setOverrideSettings] = useState({
    name: '',
    address: '',
    logoText: '',
    themeColor: '#2563eb',
    logoUrl: ''
  });

  const fetchDatabase = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/dev/db');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
        
        // Initialize JSON text drafts
        setJsonDrafts({
          customers: JSON.stringify(data.customers || [], null, 2),
          tickets: JSON.stringify(data.tickets || [], null, 2),
          passwords: JSON.stringify(data.passwords || {}, null, 2),
          settings: JSON.stringify(data.companySettings || {}, null, 2)
        });

        // Initialize quick settings override
        if (data.companySettings) {
          setOverrideSettings({
            name: data.companySettings.name || '',
            address: data.companySettings.address || '',
            logoText: data.companySettings.logoText || '',
            themeColor: data.companySettings.themeColor || '#2563eb',
            logoUrl: data.companySettings.logoUrl || ''
          });
          setAppScriptUrl(data.companySettings.appScriptWebhookUrl || '');
        }
      } else {
        setErrorMessage('Gagal memuat raw database.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const handleSaveJsonOverride = async (type: 'customers' | 'tickets' | 'passwords' | 'settings') => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Validate JSON syntax first
      let parsedData;
      try {
        parsedData = JSON.parse(jsonDrafts[type]);
      } catch (parseErr: any) {
        throw new Error(`Format JSON tidak valid: ${parseErr.message}`);
      }

      const bodyPayload: any = {};
      bodyPayload[type] = parsedData;

      const res = await fetch('/api/dev/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setSuccessMessage(`Berhasil menimpa (override) tabel database ${type} secara langsung!`);
        await fetchDatabase();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Gagal menyimpan perubahan ke server.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal melakukan override.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettingsOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/dev/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: overrideSettings })
      });

      if (res.ok) {
        setSuccessMessage('Berhasil memperbarui konfigurasi sistem rahasia!');
        await fetchDatabase();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Gagal memperbarui konfigurasi.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppScriptUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/settings/appscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appScriptWebhookUrl: appScriptUrl })
      });

      if (res.ok) {
        setSuccessMessage('Berhasil memperbarui URL webhook Google Apps Script!');
        await fetchDatabase();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Gagal memperbarui URL webhook.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkAndSyncDatabase = async () => {
    setSyncSuccessMessage('');
    setSyncErrorMessage('');
    if (!appScriptUrl.trim()) {
      setSyncErrorMessage('Harap masukkan URL Web App Google Apps Script Anda.');
      return;
    }
    if (!appScriptUrl.trim().startsWith('https://script.google.com/')) {
      setSyncErrorMessage('Format URL salah. Harus diawali dengan https://script.google.com/');
      return;
    }

    setSyncLoading(true);
    try {
      const response = await fetch(appScriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          // 1. Update localStorage
          if (data.companySettings) {
            const updatedSettings = { ...data.companySettings, appScriptWebhookUrl: appScriptUrl.trim() };
            localStorage.setItem('db_company_settings', JSON.stringify(updatedSettings));
          } else {
            const fallbackSettings = { name: companyName, appScriptWebhookUrl: appScriptUrl.trim() };
            localStorage.setItem('db_company_settings', JSON.stringify(fallbackSettings));
          }
          if (Array.isArray(data.customers)) {
            localStorage.setItem('db_customers', JSON.stringify(data.customers));
          }
          if (Array.isArray(data.tickets)) {
            localStorage.setItem('db_tickets', JSON.stringify(data.tickets));
          }
          if (Array.isArray(data.packages)) {
            localStorage.setItem('db_packages', JSON.stringify(data.packages));
          }
          if (Array.isArray(data.coverage)) {
            localStorage.setItem('db_coverage_areas', JSON.stringify(data.coverage));
          }
          if (Array.isArray(data.testimonials)) {
            localStorage.setItem('db_testimonials', JSON.stringify(data.testimonials));
          }

          // 2. Sync to backend server
          const saveBody: any = {};
          if (data.companySettings) {
            saveBody.settings = { ...data.companySettings, appScriptWebhookUrl: appScriptUrl.trim() };
          } else {
            saveBody.settings = { appScriptWebhookUrl: appScriptUrl.trim() };
          }
          if (Array.isArray(data.customers)) {
            saveBody.customers = data.customers;
          }
          if (Array.isArray(data.tickets)) {
            saveBody.tickets = data.tickets;
          }
          if (Array.isArray(data.packages)) {
            saveBody.packages = data.packages;
          }
          if (Array.isArray(data.coverage)) {
            saveBody.coverage = data.coverage;
          }
          if (Array.isArray(data.testimonials)) {
            saveBody.testimonials = data.testimonials;
          }

          const saveRes = await fetch('/api/dev/db/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveBody)
          });

          if (!saveRes.ok) {
            console.warn('Gagal menyimpan sinkronisasi ke server, tetapi local storage berhasil diperbarui.');
          }

          // Trigger local storage event to notify current active state
          window.dispatchEvent(new Event('storage'));
          setSyncSuccessMessage('Database Berhasil Sinkron! Seluruh pelanggan, tagihan, tiket, paket, cakupan wilayah, dan kustomisasi berhasil dimuat.');
          
          // Reload local states inside Developer Dashboard
          await fetchDatabase();
        } else {
          setSyncErrorMessage('Google Sheets membalas dengan status tidak sukses. Periksa kembali script Anda.');
        }
      } else {
        setSyncErrorMessage(`Koneksi ditolak oleh Google Apps Script (Status: ${response.status}). Pastikan Web App Anda di-deploy dengan akses "Anyone" (Siapa saja).`);
      }
    } catch (err: any) {
      console.error(err);
      setSyncErrorMessage(`Gagal menghubungi server database Google Sheets: ${err.message || 'Harap periksa CORS atau izin akses Web App Anda.'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCopyAppsScript = () => {
    const scriptCode = `/**
 * Google Apps Script Web App Template (Patasnet / Taranet WiFi)
 * Copy and deploy this code in script.google.com as a Web App to integrate Google Sheets & Drive!
 * This script will AUTOMATICALLY create all necessary sheets and columns on its first execution!
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Support retrieving the complete database to synchronize new devices
    if (data.action === "load") {
      var result = {
        status: "success",
        message: "Data loaded successfully from Spreadsheet!"
      };
      
      // Read Pengaturan_Sistem
      var sheetSettings = ss.getSheetByName("Pengaturan_Sistem");
      if (sheetSettings && sheetSettings.getLastRow() >= 2) {
        var row = sheetSettings.getRange(2, 1, 1, 7).getValues()[0];
        result.companySettings = {
          name: row[0] || "",
          address: row[1] || "",
          logoText: row[2] || "",
          themeColor: row[3] || "",
          tagline: row[4] || "",
          billingDate: Number(row[5]) || 20,
          contactPhone: row[6] || ""
        };
      }
      
      // Read Pelanggan & Tagihan_Pembayaran
      var sheetCustomers = ss.getSheetByName("Pelanggan");
      var customers = [];
      if (sheetCustomers && sheetCustomers.getLastRow() >= 2) {
        var rows = sheetCustomers.getRange(2, 1, sheetCustomers.getLastRow() - 1, 10).getValues();
        customers = rows.map(function(r) {
          var coords = [-6.2088, 106.8456];
          if (r[5]) {
            var parts = r[5].toString().split(",");
            if (parts.length === 2) {
              coords = [Number(parts[0]) || -6.2088, Number(parts[1]) || 106.8456];
            }
          }
          return {
            id: r[0] || "",
            name: r[1] || "",
            email: r[2] || "",
            phone: r[3] || "",
            address: r[4] || "",
            coordinates: coords,
            packageId: r[6] || "",
            status: r[7] || "",
            createdAt: r[8] || "",
            ktpImageUrl: r[9] || "",
            payments: []
          };
        });
      }
      
      var sheetPayments = ss.getSheetByName("Tagihan_Pembayaran");
      if (sheetPayments && sheetPayments.getLastRow() >= 2) {
        var pRows = sheetPayments.getRange(2, 1, sheetPayments.getLastRow() - 1, 10).getValues();
        pRows.forEach(function(r) {
          var pId = r[0] || "";
          var custId = r[1] || "";
          var pDate = r[3] || "";
          var pAmount = Number(r[4]) || 0;
          var pStatus = r[5] || "";
          var pPeriod = r[6] || "";
          var pMethod = r[7] || "";
          var pTxId = r[8] || "";
          var pProof = r[9] || "";
          
          var cust = customers.find(function(c) { return c.id === custId; });
          if (cust) {
            cust.payments.push({
              id: pId,
              date: pDate,
              amount: pAmount,
              status: pStatus,
              billingPeriod: pPeriod,
              method: pMethod,
              transactionId: pTxId,
              proofOfPaymentUrl: pProof
            });
          }
        });
      }
      result.customers = customers;
      
      // Read Tiket_Dukungan
      var sheetTickets = ss.getSheetByName("Tiket_Dukungan");
      var tickets = [];
      if (sheetTickets && sheetTickets.getLastRow() >= 2) {
        var tRows = sheetTickets.getRange(2, 1, sheetTickets.getLastRow() - 1, 8).getValues();
        tickets = tRows.map(function(r) {
          return {
            id: r[0] || "",
            userId: r[1] || "",
            userName: r[2] || "",
            email: r[3] || "",
            phone: r[4] || "",
            message: r[5] || "",
            date: r[6] || "",
            status: r[7] || ""
          };
        });
      }
      result.tickets = tickets;
      
      // Read Paket_Internet
      var sheetPackages = ss.getSheetByName("Paket_Internet");
      var packages = [];
      if (sheetPackages && sheetPackages.getLastRow() >= 2) {
        var pkgRows = sheetPackages.getRange(2, 1, sheetPackages.getLastRow() - 1, 7).getValues();
        packages = pkgRows.map(function(r) {
          return {
            id: r[0] || "",
            name: r[1] || "",
            speed: r[2] || "",
            price: Number(r[3]) || 0,
            type: r[4] || "home",
            features: r[5] ? r[5].toString().split(",").map(function(f) { return f.trim(); }) : [],
            popular: r[6] === "Ya"
          };
        });
      }
      result.packages = packages;
      
      // Read Cakupan_Wilayah
      var sheetCoverage = ss.getSheetByName("Cakupan_Wilayah");
      var coverage = [];
      if (sheetCoverage && sheetCoverage.getLastRow() >= 2) {
        var covRows = sheetCoverage.getRange(2, 1, sheetCoverage.getLastRow() - 1, 4).getValues();
        coverage = covRows.map(function(r) {
          return {
            cityName: r[0] || "",
            regionType: r[1] || "Kota",
            totalKecamatan: Number(r[2]) || 0,
            totalKelurahan: Number(r[3]) || 0,
            kecamatans: []
          };
        });
      }
      result.coverage = coverage;
      
      // Read Testimoni_Pelanggan
      var sheetTestimonials = ss.getSheetByName("Testimoni_Pelanggan");
      var testimonials = [];
      if (sheetTestimonials && sheetTestimonials.getLastRow() >= 2) {
        var testiRows = sheetTestimonials.getRange(2, 1, sheetTestimonials.getLastRow() - 1, 8).getValues();
        testimonials = testiRows.map(function(r) {
          return {
            id: r[0] || "",
            name: r[1] || "",
            role: r[2] || "",
            location: r[3] || "",
            rating: Number(r[4]) || 5,
            text: r[5] || "",
            tag: r[6] || "",
            createdAt: r[7] || ""
          };
        });
      }
      result.testimonials = testimonials;
      
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Helper function to insert a sheet if missing and setup styling and headers
    function getOrCreateSheet(name, headers) {
      var sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
        sheet.appendRow(headers);
        
        // Format headers: bold, background slate, text white
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#0f172a"); // slate-900
        headerRange.setFontColor("#f8fafc");  // slate-50
        sheet.setFrozenRows(1);
      }
      return sheet;
    }
    
    // 1. SYSTEM CONFIGURATION SHEET
    if (data.companySettings) {
      var sheetSettings = getOrCreateSheet("Pengaturan_Sistem", [
        "Nama Perusahaan", "Alamat Kantor", "Teks Logo", "Warna Tema", "Tagline", "Tanggal Jatuh Tempo", "No Kontak Telepon", "Terakhir Diperbarui"
      ]);
      // Remove stale data, keep header
      if (sheetSettings.getLastRow() > 1) {
        sheetSettings.deleteRows(2, sheetSettings.getLastRow() - 1);
      }
      var s = data.companySettings;
      sheetSettings.appendRow([
        s.name || "",
        s.address || "",
        s.logoText || "",
        s.themeColor || "",
        s.tagline || "",
        s.billingDate || "",
        s.contactPhone || "",
        new Date().toLocaleString("id-ID")
      ]);
    }
    
    // 2. CUSTOMER LIST & BILLING PAYMENTS
    if (data.customers) {
      var sheetCustomers = getOrCreateSheet("Pelanggan", [
        "ID Pelanggan", "Nama Lengkap", "Email", "Nomor Handphone", "Alamat Rumah", "Koordinat GPS", "ID Paket", "Status Akun", "Tanggal Daftar", "Tautan Foto KTP"
      ]);
      var sheetPayments = getOrCreateSheet("Tagihan_Pembayaran", [
        "ID Pembayaran", "ID Pelanggan", "Nama Pelanggan", "Tanggal Transaksi", "Jumlah Rp", "Status", "Periode", "Metode", "ID Transaksi", "Tautan Bukti Bayar"
      ]);
      
      if (sheetCustomers.getLastRow() > 1) {
        sheetCustomers.deleteRows(2, sheetCustomers.getLastRow() - 1);
      }
      if (sheetPayments.getLastRow() > 1) {
        sheetPayments.deleteRows(2, sheetPayments.getLastRow() - 1);
      }
      
      data.customers.forEach(function(c) {
        sheetCustomers.appendRow([
          c.id || "",
          c.name || "",
          c.email || "",
          c.phone || "",
          c.address || "",
          c.coordinates ? c.coordinates.join(", ") : "",
          c.packageId || "",
          c.status || "",
          c.createdAt || "",
          c.ktpImageUrl || ""
        ]);
        
        if (c.payments && c.payments.length > 0) {
          c.payments.forEach(function(p) {
            sheetPayments.appendRow([
              p.id || "",
              c.id || "",
              c.name || "",
              p.date || "",
              p.amount || 0,
              p.status || "",
              p.billingPeriod || "",
              p.method || "",
              p.transactionId || "",
              p.proofOfPaymentUrl || ""
            ]);
          });
        }
      });
    }
    
    // 3. SUPPORT TICKETS
    if (data.tickets) {
      var sheetTickets = getOrCreateSheet("Tiket_Dukungan", [
        "ID Tiket", "ID Pelanggan", "Nama Pengirim", "Email", "No Handphone", "Pesan Pengaduan", "Tanggal Pengaduan", "Status"
      ]);
      if (sheetTickets.getLastRow() > 1) {
        sheetTickets.deleteRows(2, sheetTickets.getLastRow() - 1);
      }
      data.tickets.forEach(function(t) {
        sheetTickets.appendRow([
          t.id || "",
          t.userId || "",
          t.userName || "",
          t.email || "",
          t.phone || "",
          t.message || "",
          t.date || "",
          t.status || ""
        ]);
      });
    }
    
    // 4. BROADBAND PACKAGES
    if (data.packages) {
      var sheetPackages = getOrCreateSheet("Paket_Internet", [
        "ID Paket", "Nama Layanan", "Kecepatan", "Harga Bulanan Rp", "Kategori Tipe", "Daftar Fitur", "Rekomendasi Populer"
      ]);
      if (sheetPackages.getLastRow() > 1) {
        sheetPackages.deleteRows(2, sheetPackages.getLastRow() - 1);
      }
      data.packages.forEach(function(p) {
        sheetPackages.appendRow([
          p.id || "",
          p.name || "",
          p.speed || "",
          p.price || 0,
          p.type || "",
          p.features ? p.features.join(", ") : "",
          p.popular ? "Ya" : "Tidak"
        ]);
      });
    }
    
    // 5. COVERAGE AREAS
    if (data.coverage) {
      var sheetCoverage = getOrCreateSheet("Cakupan_Wilayah", [
        "Nama Kota / Kabupaten", "Tipe Wilayah", "Total Kecamatan", "Total Kelurahan Tercover"
      ]);
      if (sheetCoverage.getLastRow() > 1) {
        sheetCoverage.deleteRows(2, sheetCoverage.getLastRow() - 1);
      }
      data.coverage.forEach(function(cov) {
        sheetCoverage.appendRow([
          cov.cityName || "",
          cov.regionType || "",
          cov.totalKecamatan || 0,
          cov.totalKelurahan || 0
        ]);
      });
    }
    
    // 6. CUSTOMER TESTIMONIALS
    if (data.testimonials) {
      var sheetTestimonials = getOrCreateSheet("Testimoni_Pelanggan", [
        "ID Testimoni", "Nama Pengulas", "Role / Paket", "Lokasi", "Rating Bintang", "Isi Ulasan", "Tag Kategori", "Tanggal"
      ]);
      if (sheetTestimonials.getLastRow() > 1) {
        sheetTestimonials.deleteRows(2, sheetTestimonials.getLastRow() - 1);
      }
      data.testimonials.forEach(function(testi) {
        sheetTestimonials.appendRow([
          testi.id || "",
          testi.name || "",
          testi.role || "",
          testi.location || "",
          testi.rating || 5,
          testi.text || "",
          testi.tag || "",
          testi.createdAt || ""
        ]);
      });
    }

    // Google Drive Integration for base64 images (Optional new member KTP Upload)
    var createdFileUrl = "";
    if (data.ktpImageBase64 && data.name) {
      try {
        var folderName = "Patasnet_KTP_Uploads";
        var folders = DriveApp.getFoldersByName(folderName);
        var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        
        var base64Data = data.ktpImageBase64.split(",")[1];
        var contentType = data.ktpImageBase64.split(",")[0].split(":")[1].split(";")[0];
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, contentType, "KTP_" + data.name + "_" + Math.floor(1000 + Math.random() * 9000) + ".jpg");
        
        var file = targetFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        createdFileUrl = file.getUrl();
      } catch (driveErr) {
        // Ignored or logged internally
      }
    }
    
    // Auto-fit column widths across all processed sheets
    var sheetsList = ss.getSheets();
    sheetsList.forEach(function(sh) {
      if (sh.getLastColumn() > 0) {
        sh.autoResizeColumns(1, sh.getLastColumn());
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Sinkronisasi database spreadsheet berhasil! Seluruh sheet (" + sheetsList.length + ") otomatis dibuat dan diformat dengan sempurna.",
      fileUrl: createdFileUrl 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Terjadi gangguan: " + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(scriptCode);
    alert('Kode Google Apps Script Super Cerdas berhasil disalin ke clipboard!\n\nSeluruh tabel (Pengaturan_Sistem, Pelanggan, Tagihan_Pembayaran, Tiket_Dukungan, Paket_Internet, Cakupan_Wilayah, Testimoni_Pelanggan) akan OTOMATIS dibuat dan diatur di Spreadsheet Anda ketika sinkronisasi dipicu.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Dev Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              Control Tower Dev <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">STEALTH MODE</span>
            </h1>
            <p className="text-[10px] text-slate-400">Pusat Pengelola Utama & Pengendali Sistem Rahasia</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDatabase}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800"
            title="Muat Ulang Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded-xl transition border border-red-500/20 flex items-center gap-2 text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Dev Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Placeholder to reserve space on desktop */}
        <div className="hidden md:block w-64 shrink-0 bg-transparent pointer-events-none" />

        {/* Left Stealth Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/40 border-r border-slate-800 p-6 flex flex-col gap-6 shrink-0 md:fixed md:top-24 md:left-0 md:h-[calc(100vh-96px)] overflow-y-auto z-30">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider px-3">Modul Rahasia</span>
            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition text-xs text-left ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Analitik & Ringkasan Data</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings_override')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition text-xs text-left ${
                  activeTab === 'settings_override'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Override Identitas WiFi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('db_editor')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition text-xs text-left ${
                  activeTab === 'db_editor'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileJson className="w-4 h-4" />
                <span>Editor Database RAW</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sheets_integration')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition text-xs text-left ${
                  activeTab === 'sheets_integration'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Integrasi Google Sheets</span>
              </button>
            </nav>
          </div>

          <div className="mt-auto p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-2xl">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-yellow-400/80 leading-relaxed">
                <strong>Pemberitahuan Stealth:</strong> Seluruh modul ini disembunyikan secara penuh dari menu pembeli maupun admin utama. Hanya Anda selaku webmaster pengelola yang memegang kredensial akses backdoor ini.
              </div>
            </div>
          </div>
        </aside>

        {/* Right Dev Panel */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-4 bg-red-600/25 border border-red-500 rounded-2xl text-red-200 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-4 bg-emerald-600/25 border border-emerald-500 rounded-2xl text-emerald-200 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Jumlah Pelanggan</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">
                      {dbData?.customers?.length || 0}
                    </h2>
                  </div>
                  <Users className="w-8 h-8 text-blue-500/20" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tiket Gangguan</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">
                      {dbData?.tickets?.length || 0}
                    </h2>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500/20" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Database Passwords</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">
                      {dbData?.passwords ? Object.keys(dbData.passwords).length : 0}
                    </h2>
                  </div>
                  <Key className="w-8 h-8 text-emerald-500/20" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Area Jangkauan</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">
                      {dbData?.coverageList?.length || 0} Kota
                    </h2>
                  </div>
                  <Database className="w-8 h-8 text-purple-500/20" />
                </div>
              </div>

              {/* Quick Customer Inspection Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
                    Daftar Cepat Akun Pelanggan & Password Encrypted
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Live Backend Database Sync</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-500 font-bold uppercase border-b border-slate-800">
                        <th className="py-3 px-4">ID Pelanggan</th>
                        <th className="py-3 px-4">Nama Pelanggan</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">No Handphone</th>
                        <th className="py-3 px-4">Hash Sandi Terenkripsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {dbData?.customers && dbData.customers.length > 0 ? (
                        dbData.customers.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-4 text-blue-400 font-bold">{c.id}</td>
                            <td className="py-3 px-4 text-slate-200 font-sans font-semibold">{c.name}</td>
                            <td className="py-3 px-4 text-slate-400">{c.email}</td>
                            <td className="py-3 px-4 text-slate-400">{c.phone}</td>
                            <td className="py-3 px-4 text-slate-500 truncate max-w-xs" title={dbData?.passwords?.[c.id] || 'N/A'}>
                              {dbData?.passwords?.[c.id] || <span className="italic text-slate-600">Bypass Google/N/A</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-bold">
                            Belum ada pelanggan terdaftar dalam database JSON.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS OVERRIDE FORM */}
          {activeTab === 'settings_override' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl animate-in fade-in duration-300">
              <div>
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" /> Pengendalian Konfigurasi & Logo WiFi
                </h3>
                <p className="text-slate-400 text-xs mt-2">
                  Ubah identitas visual, logo kustom, nama perusahaan, serta alamat langsung dari panel pengelola.
                </p>
              </div>

              <form onSubmit={handleSaveSettingsOverride} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 uppercase text-[10px]">Nama Perusahaan WiFi</label>
                  <input
                    type="text"
                    value={overrideSettings.name}
                    onChange={(e) => setOverrideSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 text-white"
                    placeholder="Contoh: Taranet WiFi"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 uppercase text-[10px]">Teks Logo Identitas Visual</label>
                  <input
                    type="text"
                    value={overrideSettings.logoText}
                    onChange={(e) => setOverrideSettings(prev => ({ ...prev, logoText: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 text-white"
                    placeholder="Contoh: TARANET"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 uppercase text-[10px]">Alamat Lengkap Perusahaan</label>
                  <textarea
                    rows={3}
                    value={overrideSettings.address}
                    onChange={(e) => setOverrideSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 text-white"
                    placeholder="Alamat kantor..."
                    required
                  />
                </div>

                {/* Upload Logo Block inside Dev Dashboard */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 uppercase text-[10px]">Upload / Atur Logo Kustom</label>
                  <div className="flex items-center gap-4 p-4 border border-slate-800 rounded-xl bg-slate-950">
                    {overrideSettings.logoUrl ? (
                      <img src={overrideSettings.logoUrl} alt="Logo Preview" className="h-12 w-12 object-contain rounded border border-slate-800 bg-white p-1" />
                    ) : (
                      <div className="h-12 w-12 rounded border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-bold font-sans">
                        LOGO
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setOverrideSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                      />
                      <p className="text-[9px] text-slate-500 mt-1">Sistem menyandikan berkas gambar sebagai string Base64 yang awet.</p>
                    </div>
                    {overrideSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setOverrideSettings(prev => ({ ...prev, logoUrl: '' }))}
                        className="px-2.5 py-1 text-[10px] font-bold text-red-400 bg-red-950/40 hover:bg-red-900/40 rounded-lg transition"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 text-xs"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Terapkan Override Rahasia</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: RAW DATABASE OVERRIDES */}
          {activeTab === 'db_editor' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-purple-500" /> Direct Database Overrides (Bypass Segala Aturan!)
                </h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Gunakan editor JSON di bawah ini untuk memodifikasi record database secara langsung di server. Anda dapat menambah, menghapus, atau mengubah data pembayaran, koordinat GPS, status KTP, maupun sandi tanpa ada limitasi sistem.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
                {/* Editor 1: Customers */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-sans font-bold text-slate-300">Tabel: Customers (db_customers.json)</span>
                    <button
                      type="button"
                      onClick={() => handleSaveJsonOverride('customers')}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[10px] flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Overwrite
                    </button>
                  </div>
                  <textarea
                    value={jsonDrafts.customers}
                    onChange={(e) => setJsonDrafts(prev => ({ ...prev, customers: e.target.value }))}
                    className="flex-1 w-full p-4 bg-slate-950 font-mono text-[11px] text-slate-300 focus:outline-none resize-none"
                    placeholder="Loading..."
                  />
                </div>

                {/* Editor 2: Passwords */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-sans font-bold text-slate-300">Tabel: Passwords (db_passwords.json)</span>
                    <button
                      type="button"
                      onClick={() => handleSaveJsonOverride('passwords')}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[10px] flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Overwrite
                    </button>
                  </div>
                  <textarea
                    value={jsonDrafts.passwords}
                    onChange={(e) => setJsonDrafts(prev => ({ ...prev, passwords: e.target.value }))}
                    className="flex-1 w-full p-4 bg-slate-950 font-mono text-[11px] text-slate-300 focus:outline-none resize-none"
                    placeholder="Loading..."
                  />
                </div>

                {/* Editor 3: Tickets */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-sans font-bold text-slate-300">Tabel: Support Tickets (db_tickets.json)</span>
                    <button
                      type="button"
                      onClick={() => handleSaveJsonOverride('tickets')}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[10px] flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Overwrite
                    </button>
                  </div>
                  <textarea
                    value={jsonDrafts.tickets}
                    onChange={(e) => setJsonDrafts(prev => ({ ...prev, tickets: e.target.value }))}
                    className="flex-1 w-full p-4 bg-slate-950 font-mono text-[11px] text-slate-300 focus:outline-none resize-none"
                    placeholder="Loading..."
                  />
                </div>

                {/* Editor 4: Company Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-sans font-bold text-slate-300">Tabel: Company Settings (db_company_settings.json)</span>
                    <button
                      type="button"
                      onClick={() => handleSaveJsonOverride('settings')}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[10px] flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Overwrite
                    </button>
                  </div>
                  <textarea
                    value={jsonDrafts.settings}
                    onChange={(e) => setJsonDrafts(prev => ({ ...prev, settings: e.target.value }))}
                    className="flex-1 w-full p-4 bg-slate-950 font-mono text-[11px] text-slate-300 focus:outline-none resize-none"
                    placeholder="Loading..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE APPS SCRIPT INTEGRATION */}
          {activeTab === 'sheets_integration' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-3xl animate-in fade-in duration-300">
              <div>
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" /> Sinkronisasi Google Sheets & Google Drive
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2 text-xs">
                  Sistem kami mendukung penyimpanan data pelanggan langsung ke **Google Sheets (Spreadsheet)** Anda dan menyimpan berkas foto KTP langsung ke **Google Drive** menggunakan perantara **Google Apps Script Web App API**.
                </p>
              </div>

              <div className="bg-blue-950/40 border border-blue-900/50 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-blue-300 text-xs uppercase tracking-wider">Cara Menghubungkan Google Spreadsheet & Drive Anda:</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li>Buka Google Spreadsheet baru, lalu klik menu **Ekstensi** &gt; **Apps Script**.</li>
                  <li>Salin kode integrasi otomatis dengan mengeklik tombol di bawah ini.</li>
                  <li>Tempelkan kode di editor Apps Script Anda, klik **Terapkan (Deploy)** &gt; **Penerapan Baru**.</li>
                  <li>Pilih jenis **Aplikasi Web**, ubah akses menjadi **"Siapa saja" (Anyone)**, dan klik Terapkan.</li>
                  <li>Salin URL Aplikasi Web yang dihasilkan dan masukkan ke formulir di bawah ini!</li>
                </ol>

                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 text-xs"
                >
                  Salin Kode Google Apps Script Otomatis
                </button>
              </div>

              <form onSubmit={handleSaveAppScriptUrl} className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Atur Webhook URL Aplikasi Web:</h4>
                
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 uppercase text-[10px]">Google Apps Script Web App URL</label>
                  <input
                    type="url"
                    value={appScriptUrl}
                    onChange={(e) => setAppScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 text-white text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Menerima post request yang terenkripsi aman secara otomatis ketika pelanggan mendaftar.</p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 text-xs"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Konfigurasi Webhook</span>
                    </>
                  )}
                </button>
              </form>

              {/* Google Sheets Cloud Synchronization Container inside Dev Dashboard */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  Koneksi & Sinkronisasi Cloud Instan:
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jika Anda sedang membuka aplikasi di HP baru atau Laptop lain, Anda dapat menarik data kustomisasi logo, nama perusahaan, daftar pelanggan, tagihan pembayaran, paket wifi, dan tiket pengaduan langsung dari Google Spreadsheet untuk disinkronkan ke local storage dan server database secara otomatis.
                </p>
                <div className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={handleLinkAndSyncDatabase}
                    disabled={syncLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                    {syncLoading ? 'Sinkronisasi Cloud...' : 'Hubungkan & Tarik Seluruh Data Spreadsheet'}
                  </button>
                  {syncSuccessMessage && (
                    <p className="text-xs text-emerald-400 font-bold bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30 leading-normal">
                      ✓ {syncSuccessMessage}
                    </p>
                  )}
                  {syncErrorMessage && (
                    <p className="text-xs text-red-400 font-bold bg-red-950/20 p-3 rounded-xl border border-red-900/30 leading-normal">
                      ✗ {syncErrorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
