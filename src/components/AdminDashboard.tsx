import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  CreditCard,
  Download,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Settings,
  ShieldCheck,
  Globe,
  Database,
  Trash,
  PhoneCall,
  Search,
  Check,
  RefreshCw,
  Wifi,
  Plus,
  Percent,
  Tag,
  UploadCloud,
  Image,
  FileText,
  Eye,
  EyeOff,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { CustomerUser, PaymentRecord, SupportTicket } from '../types';
import { generateCustomerPDFReport, generateAdminMonthlyPDFReport } from '../lib/pdfGenerator';
import { PACKAGES } from './Home';
import Logo from './Logo';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';

// Leaflet import for admin map visualization
import L from 'leaflet';

interface AdminDashboardProps {
  customers: CustomerUser[];
  supportTickets: SupportTicket[];
  onRefreshData: () => void;
  onUpdateCustomerStatus: (id: string, status: 'pending' | 'active' | 'suspended') => Promise<void>;
  onVerifyPayment: (userId: string, paymentId: string) => Promise<void>;
  onRejectPayment?: (userId: string, paymentId: string) => Promise<void>;
  whatsappLogs?: any[];
  companySettings?: { name: string; address: string; logoText: string; themeColor: string; logoUrl?: string; promos?: string[]; tagline?: string; billingDate?: number; contactPhone?: string };
  onUpdateCompanySettings?: (newSettings: { name: string; address: string; logoText: string; themeColor: string; logoUrl?: string; tagline?: string; billingDate?: number; contactPhone?: string }) => Promise<boolean>;
  packages?: any[];
  onRefreshPackages?: () => void;
}

export default function AdminDashboard({
  customers,
  supportTickets,
  onRefreshData,
  onUpdateCustomerStatus,
  onVerifyPayment,
  onRejectPayment,
  whatsappLogs,
  companySettings,
  onUpdateCompanySettings,
  packages = [],
  onRefreshPackages
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'payments' | 'tickets' | 'company_settings' | 'coverage' | 'packages'>('overview');
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForMap, setSelectedUserForMap] = useState<CustomerUser | null>(null);

  const [sheetSyncState, setSheetSyncState] = useState<'idle' | 'syncing' | 'success'>('success');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Baru saja');

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setLastSyncTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

    const interval = setInterval(() => {
      setSheetSyncState('syncing');
      setTimeout(() => {
        const timeNow = new Date();
        setLastSyncTime(`${pad(timeNow.getHours())}:${pad(timeNow.getMinutes())}:${pad(timeNow.getSeconds())}`);
        setSheetSyncState('success');
      }, 2500);
    }, 40000);

    return () => clearInterval(interval);
  }, []);

  // Count payments waiting for verification
  const pendingPaymentsCount = customers.reduce(
    (count, c) => count + (c.payments?.filter((p) => p.status === 'pending_verification').length || 0),
    0
  );

  // Company Settings form states
  const [companyNameInput, setCompanyNameInput] = useState(companySettings?.name || 'Taranet WiFi');
  const [companyAddressInput, setCompanyAddressInput] = useState(companySettings?.address || '');
  const [companyLogoTextInput, setCompanyLogoTextInput] = useState(companySettings?.logoText || 'TARANET');
  const [companyLogoUrlInput, setCompanyLogoUrlInput] = useState(companySettings?.logoUrl || '');
  const [companyTaglineInput, setCompanyTaglineInput] = useState(companySettings?.tagline || 'ULTRA BROADBAND');
  const [companyBillingDateInput, setCompanyBillingDateInput] = useState<number>(companySettings?.billingDate || 20);
  const [companyPhoneInput, setCompanyPhoneInput] = useState(companySettings?.contactPhone || '+62 899-3299-977');
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Sync inputs with props if they load later
  useEffect(() => {
    if (companySettings) {
      setCompanyNameInput(companySettings.name);
      setCompanyAddressInput(companySettings.address);
      setCompanyLogoTextInput(companySettings.logoText);
      setCompanyLogoUrlInput(companySettings.logoUrl || '');
      setCompanyTaglineInput(companySettings.tagline || 'ULTRA BROADBAND');
      setCompanyBillingDateInput(companySettings.billingDate || 20);
      setCompanyPhoneInput(companySettings.contactPhone || '+62 899-3299-977');
    }
  }, [companySettings]);

  const [coverageList, setCoverageList] = useState<any[]>([]);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    variant?: 'danger' | 'primary' | 'success';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Ya, Hapus',
    variant: 'danger',
  });

  // Coverage forms state
  const [newCityName, setNewCityName] = useState('');
  const [newCityType, setNewCityType] = useState('Kota');
  const [newKecName, setNewKecName] = useState<{ [city: string]: string }>({});
  const [newKelName, setNewKelName] = useState<{ [kecKey: string]: string }>({});

  // Wifi Package form states
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgSpeed, setNewPkgSpeed] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgType, setNewPkgType] = useState('home');
  const [newPkgFeatures, setNewPkgFeatures] = useState('');
  const [newPkgPopular, setNewPkgPopular] = useState(false);
  const [addingPackage, setAddingPackage] = useState(false);

  // Promo upload states
  const [promoImageBase64, setPromoImageBase64] = useState('');
  const [uploadingPromo, setUploadingPromo] = useState(false);

  const handleUpdateCustomerPackage = async (id: string, packageId: string) => {
    try {
      const response = await fetch('/api/customers/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, packageId }),
      });
      if (response.ok) {
        onRefreshData();
      } else {
        const err = await response.json();
        alert('Gagal memperbarui paket: ' + err.message);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const fetchCoverageList = async () => {
    setLoadingCoverage(true);
    try {
      const response = await fetch('/api/coverage');
      if (response.ok) {
        const data = await response.json();
        setCoverageList(data || []);
        onRefreshData(); // Propagate coverage data change to App.tsx
      }
    } catch (err) {
      console.error('Failed to fetch coverage:', err);
    } finally {
      setLoadingCoverage(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'coverage') {
      fetchCoverageList();
    }
  }, [activeTab]);

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || !newPkgSpeed || !newPkgPrice) {
      alert('Semua kolom bertanda * wajib diisi!');
      return;
    }
    setAddingPackage(true);
    try {
      const featuresArr = newPkgFeatures
        .split(/[,\n]/)
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPkgName,
          speed: newPkgSpeed,
          price: Number(newPkgPrice),
          type: newPkgType,
          features: featuresArr,
          popular: newPkgPopular
        })
      });

      if (response.ok) {
        setNewPkgName('');
        setNewPkgSpeed('');
        setNewPkgPrice('');
        setNewPkgFeatures('');
        setNewPkgPopular(false);
        if (onRefreshPackages) {
          onRefreshPackages();
        }
        alert('Paket WiFi baru berhasil ditambahkan!');
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal menambahkan paket WiFi.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setAddingPackage(false);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Paket WiFi',
      message: 'Apakah Anda yakin ingin menghapus paket WiFi ini?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/packages/${pkgId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            if (onRefreshPackages) {
              onRefreshPackages();
            }
            alert('Paket WiFi berhasil dihapus.');
          } else {
            alert('Gagal menghapus paket WiFi.');
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan koneksi.');
        }
      }
    });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Pelanggan',
      message: 'Apakah Anda yakin ingin menghapus pelanggan ini dari sistem? Tindakan ini permanen dan tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            onRefreshData();
            alert('Pelanggan berhasil dihapus dari sistem.');
          } else {
            alert('Gagal menghapus pelanggan.');
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan koneksi.');
        }
      }
    });
  };

  const handleUploadPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoImageBase64) {
      alert('Pilih berkas gambar promo terlebih dahulu!');
      return;
    }
    setUploadingPromo(true);
    try {
      const response = await fetch('/api/settings/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoImageBase64 })
      });
      if (response.ok) {
        setPromoImageBase64('');
        onRefreshData();
        alert('Gambar promo berhasil diunggah!');
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal mengunggah promo.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setUploadingPromo(false);
    }
  };

  const handleDeletePromo = async (index: number) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Promo',
      message: 'Apakah Anda yakin ingin menghapus promo ini?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/settings/promos/${index}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            onRefreshData();
            alert('Promo berhasil dihapus.');
          } else {
            alert('Gagal menghapus promo.');
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan koneksi.');
        }
      }
    });
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    try {
      const response = await fetch('/api/coverage/city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName: newCityName.trim(), regionType: newCityType })
      });
      if (response.ok) {
        setNewCityName('');
        await fetchCoverageList();
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal menambahkan kota.');
      }
    } catch (err) {
      console.error(err);
      alert('Kesalahan jaringan.');
    }
  };

  const handleDeleteCity = async (cityName: string) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Kota/Kabupaten',
      message: `Apakah Anda yakin ingin menghapus Kota/Kabupaten ${cityName} beserta seluruh Kecamatan & Kelurahan di dalamnya?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/coverage/city/${encodeURIComponent(cityName)}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            await fetchCoverageList();
          } else {
            alert('Gagal menghapus kota.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAddKecamatan = async (cityName: string) => {
    const name = newKecName[cityName];
    if (!name || !name.trim()) return;

    try {
      const response = await fetch('/api/coverage/kecamatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName, name: name.trim() })
      });
      if (response.ok) {
        setNewKecName(prev => ({ ...prev, [cityName]: '' }));
        await fetchCoverageList();
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal menambahkan kecamatan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKecamatan = async (cityName: string, name: string) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Kecamatan',
      message: `Hapus kecamatan ${name}?`,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/coverage/kecamatan/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityName, name })
          });
          if (response.ok) {
            await fetchCoverageList();
          } else {
            alert('Gagal menghapus kecamatan.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAddKelurahan = async (cityName: string, kecamatanName: string) => {
    const key = `${cityName}-${kecamatanName}`;
    const name = newKelName[key];
    if (!name || !name.trim()) return;

    try {
      const response = await fetch('/api/coverage/kelurahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName, kecamatanName, name: name.trim() })
      });
      if (response.ok) {
        setNewKelName(prev => ({ ...prev, [key]: '' }));
        await fetchCoverageList();
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal menambahkan kelurahan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKelurahan = async (cityName: string, kecamatanName: string, name: string) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Kelurahan',
      message: `Hapus kelurahan ${name}?`,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/coverage/kelurahan/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityName, kecamatanName, name })
          });
          if (response.ok) {
            await fetchCoverageList();
          } else {
            alert('Gagal menghapus kelurahan.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCompanySettings) return;

    setSavingSettings(true);
    const success = await onUpdateCompanySettings({
      name: companyNameInput,
      address: companyAddressInput,
      logoText: companyLogoTextInput,
      themeColor: '#2563eb',
      logoUrl: companyLogoUrlInput,
      tagline: companyTaglineInput,
      billingDate: companyBillingDateInput,
      contactPhone: companyPhoneInput
    });
    setSavingSettings(false);
    if (success) {
      alert('Pengaturan identitas perusahaan berhasil diperbarui!');
    } else {
      alert('Gagal memperbarui pengaturan.');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Selesaikan Laporan',
      message: 'Apakah Anda yakin ingin menyelesaikan laporan gangguan ini? Koneksi internet pelanggan akan dipastikan kembali normal, dan pemberitahuan WhatsApp penyelesaian tiket akan terkirim otomatis.',
      confirmText: 'Ya, Selesaikan',
      variant: 'success',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/support/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId })
          });

          if (response.ok) {
            onRefreshData();
            setSuccessToastMessage('Tiket keluhan / laporan gangguan berhasil diselesaikan!');
            setTimeout(() => setSuccessToastMessage(null), 4000);
          } else {
            alert('Gagal menyelesaikan laporan gangguan.');
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan jaringan.');
        }
      }
    });
  };

  const handleSendWhatsAppReminder = async (userId: string, paymentId: string, type: 'before_due' | 'overdue') => {
    setSendingReminderId(`${paymentId}-${type}`);
    try {
      const response = await fetch('/api/whatsapp/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, paymentId, type })
      });
      if (response.ok) {
        alert('Notifikasi Pengingat WhatsApp berhasil dikirim ke pelanggan!');
        onRefreshData(); // refresh logs
      } else {
        alert('Gagal mengirim pengingat WhatsApp.');
      }
    } catch (err) {
      console.error(err);
      alert('Kesalahan jaringan.');
    } finally {
      setSendingReminderId(null);
    }
  };

  // Stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const pendingCustomers = customers.filter((c) => c.status === 'pending').length;
  const suspendedCustomers = customers.filter((c) => c.status === 'suspended').length;

  // Revenue calculation
  let totalRevenue = 0;
  let dailyRevenueHistory: { date: string; revenue: number }[] = [];
  let packageCount: { [key: string]: number } = {};

  const revenueByDate: { [dateStr: string]: number } = {};

  // Calculate actual transaction revenue and gather counts
  customers.forEach((c) => {
    // Count packages
    const pkg = PACKAGES.find((p) => p.id === c.packageId);
    if (pkg) {
      packageCount[pkg.name] = (packageCount[pkg.name] || 0) + 1;
    }

    c.payments.forEach((p) => {
      if (p.status === 'paid') {
        totalRevenue += p.amount;

        // Parse and format date to Indonesian format (e.g. "15 Jul")
        const paymentDateObj = new Date(p.date);
        if (!isNaN(paymentDateObj.getTime())) {
          const dateStr = paymentDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + p.amount;
        }
      }
    });
  });

  // Compile the last 20 days of revenue history deterministically
  const today = new Date();
  for (let i = 19; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    dailyRevenueHistory.push({
      date: dateStr,
      revenue: revenueByDate[dateStr] || 0
    });
  }

  // Recharts colors
  const COLORS = ['#2563eb', '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const pieData = Object.keys(packageCount).map((key) => ({
    name: key,
    value: packageCount[key]
  }));

  // WhatsApp automatic log simulations state
  const [waLogs, setWaLogs] = useState<{ id: string; phone: string; message: string; time: string }[]>([]);

  // Keep waLogs synchronized with props or default simulated ones
  useEffect(() => {
    if (whatsappLogs && whatsappLogs.length > 0) {
      setWaLogs(whatsappLogs);
    }
  }, [whatsappLogs]);

  // Function to simulate sending WhatsApp
  const logWhatsAppNotification = (phone: string, customerName: string, period: string, amount: number) => {
    const log = {
      id: Math.random().toString(36).substr(2, 9),
      phone,
      message: `[WhatsApp Otomatis] Halo ${customerName}, Pembayaran tagihan Taranet Wifi Anda untuk periode ${period} sebesar Rp ${amount.toLocaleString('id-ID')} telah BERHASIL diverifikasi dan Lunas. Internet Anda tetap aktif & stabil tanpa FUP. Terima kasih!`,
      time: new Date().toLocaleTimeString('id-ID')
    };
    setWaLogs((prev) => [log, ...prev]);
  };

  // Export to Excel using xlsx sheetjs library
  const handleExportToExcel = () => {
    const rows: any[] = [];

    customers.forEach((c) => {
      const pkg = PACKAGES.find((p) => p.id === c.packageId);
      c.payments.forEach((p) => {
        rows.push({
          'ID Pelanggan': c.id,
          'Nama Pelanggan': c.name,
          'Email': c.email,
          'No Handphone': c.phone,
          'Alamat': c.address,
          'Koordinat GPS': `${c.coordinates[0]}, ${c.coordinates[1]}`,
          'Paket Berlangganan': pkg?.name || 'Unknown',
          'Kecepatan': pkg?.speed || 'Unknown',
          'Biaya Bulanan': pkg?.price || 0,
          'Periode Tagihan': p.billingPeriod,
          'Jumlah Bayar': p.amount,
          'Status Pembayaran': p.status.toUpperCase(),
          'Metode Bayar': p.method || 'N/A',
          'Tanggal Transaksi': p.date
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi Taranet');

    // Auto fit column widths
    const max_width = rows.reduce((w, r) => Math.max(w, Object.values(r).join('').length / 8), 10);
    worksheet['!cols'] = [{ wch: max_width }];

    // Generate Excel File
    XLSX.writeFile(workbook, `Laporan_Transaksi_Taranet_Wifi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportToPDF = () => {
    generateAdminMonthlyPDFReport(customers, supportTickets, companySettings?.name || 'Taranet WiFi');
  };



  // Interactive leafet map display for customer pins
  useEffect(() => {
    if (activeTab !== 'customers' || !customers || customers.length === 0) return;

    const mapElement = document.getElementById('admin-customers-map');
    if (!mapElement) return;

    // Remove old map instance if existing
    const existingMap = (mapElement as any)._leaflet_map;
    if (existingMap) {
      existingMap.remove();
    }

    const defaultCenter: [number, number] = [-6.2088, 106.8456];
    const map = L.map(mapElement).setView(defaultCenter, 11);
    (mapElement as any)._leaflet_map = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Override marker icons safely
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Plot each customer's coordinates
    customers.forEach((c) => {
      if (c.coordinates && c.coordinates.length === 2) {
        const marker = L.marker(c.coordinates, { icon: DefaultIcon }).addTo(map);
        const pkg = PACKAGES.find((p) => p.id === c.packageId);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4;">
            <strong style="font-size: 13px; color: #1e3a8a;">${c.name}</strong><br/>
            <strong>No HP:</strong> ${c.phone}<br/>
            <strong>Paket:</strong> ${pkg?.name || 'N/A'}<br/>
            <strong>Status:</strong> <span style="font-weight:bold; color: ${c.status === 'active' ? '#10b981' : '#f59e0b'}">${c.status.toUpperCase()}</span><br/>
            <strong>Alamat:</strong> ${c.address}
          </div>
        `);
      }
    });

    // Re-invalidate size to trigger proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (map) {
        map.remove();
        delete (mapElement as any)._leaflet_map;
      }
    };
  }, [activeTab, customers]);

  // Handle focus on map coordinate
  const handleFocusOnMap = (customer: CustomerUser) => {
    setSelectedUserForMap(customer);
    const mapElement = document.getElementById('admin-customers-map');
    if (mapElement) {
      const map = (mapElement as any)._leaflet_map;
      if (map && customer.coordinates) {
        map.setView(customer.coordinates, 15);
        // Find existing markers and trigger popup could be added, but setting center is sufficient
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 sm:px-6 flex flex-row gap-4 sm:gap-8 text-xs relative">
      {/* Floating Success Toast */}
      {successToastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-extrabold text-xs">{successToastMessage}</span>
        </div>
      )}

      {/* Floating Toggle Menu Button (only visible when sidebar is closed) */}
      {!showSidebar && (
        <button
          type="button"
          onClick={() => setShowSidebar(true)}
          className="fixed bottom-6 left-6 z-40 p-3.5 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/50 hover:bg-blue-700 transition-all active:scale-95 border border-blue-500 flex items-center justify-center animate-in fade-in zoom-in duration-200"
          title="Tampilkan Menu"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      )}

      {/* LEFT SIDEBAR NAVIGATION PANEL */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <aside
        className={`${
          showSidebar ? 'translate-x-0 w-64' : '-translate-x-full md:w-0 md:opacity-0 md:overflow-hidden'
        } fixed md:sticky inset-y-0 left-0 z-50 md:z-30 shrink-0 transition-all duration-300 ease-in-out bg-white md:bg-transparent h-full md:h-[calc(100vh-160px)] md:top-28 md:self-start overflow-y-auto`}
      >
        <div className="bg-white rounded-none md:rounded-3xl border-r md:border border-slate-200/80 shadow-2xl md:shadow-md p-5 md:p-6 flex flex-col gap-4 md:gap-6 h-full w-64">
          <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-2 relative">
            <div className="min-w-0 pr-8">
              <Logo companyName={companySettings?.name} logoUrl={companySettings?.logoUrl} tagline={companySettings?.tagline} />
            </div>
            <button
              type="button"
              onClick={() => setShowSidebar(false)}
              className="absolute right-0 top-1.5 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-all active:scale-95 border border-slate-150 shrink-0"
              title="Sembunyikan Menu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">Navigasi</p>
            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Analisis & Grafik"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Analisis & Grafik</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('customers');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left ${
                  activeTab === 'customers'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Kelola Pelanggan"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Kelola Pelanggan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('payments');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left relative ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Verifikasi Bayar"
              >
                <div className="relative">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {pendingPaymentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse md:hidden" />
                  )}
                </div>
                <span>Verifikasi Bayar</span>
                {pendingPaymentsCount > 0 && (
                  <span className={`ml-auto px-2 py-0.5 text-[9px] font-extrabold rounded-full ${
                    activeTab === 'payments' ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600 animate-pulse'
                  }`}>
                    {pendingPaymentsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tickets');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left justify-between ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Pesan Masuk & Gangguan"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Pesan & Tiket Gangguan</span>
                </div>
                {supportTickets.filter((t) => t.status === 'open').length > 0 && (
                  <span className={`relative flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[9px] font-black tracking-tight animate-bounce ${
                    activeTab === 'tickets' ? 'bg-white text-blue-600 shadow-xs' : 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  }`}>
                    {supportTickets.filter((t) => t.status === 'open').length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('packages');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left ${
                  activeTab === 'packages'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Kelola Paket WiFi"
              >
                <Wifi className="w-4 h-4 shrink-0" />
                <span>Kelola Paket WiFi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('company_settings');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left ${
                  activeTab === 'company_settings'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Pengaturan"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Pengaturan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('coverage');
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left ${
                  activeTab === 'coverage'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
                title="Kelola Area Cakupan"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Kelola Area Cakupan</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Admin Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] bg-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Sistem Kontrol Administrasi {(companySettings?.name || 'Taranet').toUpperCase()}
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-500" /> Dashboard Portal Admin WiFi
            </h1>
            <p className="text-[11px] text-slate-400">Kelola pelanggan, kirim pengingat tagihan WhatsApp, pantau grafik harian, & unduh laporan Excel.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!showSidebar && (
              <button
                type="button"
                onClick={() => setShowSidebar(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-[11px] shadow-lg shadow-blue-500/20 active:scale-95"
                title="Tampilkan Menu Samping"
              >
                <ChevronsRight className="w-4 h-4" />
                <span>Tampilkan Menu</span>
              </button>
            )}

            <div 
              className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800/90 border border-slate-700/70 rounded-xl text-[10px] select-none transition-all duration-300 shrink-0"
              title="Sistem Backup database otomatis ke Google Sheets"
            >
              {sheetSyncState === 'syncing' ? (
                <div className="relative flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                </div>
              ) : (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
              )}
              <div className="text-left leading-none font-sans">
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-extrabold">Auto-Backup Sheet</span>
                <span className={`font-black tracking-tight ${sheetSyncState === 'syncing' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {sheetSyncState === 'syncing' ? 'Menyinkronkan...' : `Tersambung (${lastSyncTime})`}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSheetSyncState('syncing');
                onRefreshData();
                setTimeout(() => {
                  const timeNow = new Date();
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  setLastSyncTime(`${pad(timeNow.getHours())}:${pad(timeNow.getMinutes())}:${pad(timeNow.getSeconds())}`);
                  setSheetSyncState('success');
                }, 1500);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 active:scale-95 shrink-0"
              title="Sinkronisasi Data Baru"
            >
              <RefreshCw className={`w-4 h-4 ${sheetSyncState === 'syncing' ? 'animate-spin text-yellow-400' : ''}`} />
            </button>
            <button
              onClick={handleExportToExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 text-[11px]"
              title="Ekspor Transaksi Excel"
            >
              <Download className="w-4 h-4" /> <span className="hidden xs:inline">Ekspor Excel</span>
            </button>
            <button
              onClick={handleExportToPDF}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 text-[11px]"
              title="Ekspor Laporan Bulanan (PDF)"
            >
              <FileText className="w-4 h-4" /> <span className="hidden xs:inline">Laporan Bulanan (PDF)</span>
            </button>
          </div>
        </div>

        {/* Tabs Content Wrapper */}
        <div className="space-y-8">
        {/* TAB 1: OVERVIEW & REAL-TIME REVENUE ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Pendapatan Terverifikasi</span>
                <p className="text-xl sm:text-2xl font-black text-blue-600 font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> Real-time Revenue
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pelanggan Aktif</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{activeCustomers}</p>
                <p className="text-[10px] text-emerald-500">Koneksi Fiber Terpasang</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Antrean Pasang Baru (Pending)</span>
                <p className="text-xl sm:text-2xl font-black text-amber-500 font-mono">{pendingCustomers}</p>
                <p className="text-[10px] text-slate-400">Menunggu Verifikasi & Teknisi</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Akun Terisolir (Suspended)</span>
                <p className="text-xl sm:text-2xl font-black text-red-500 font-mono">{suspendedCustomers}</p>
                <p className="text-[10px] text-slate-400">Layanan ditangguhkan sementara</p>
              </div>
            </div>

            {/* Visual Analytics charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Revenue Chart */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Pendapatan Harian (15 Hari Terakhir)
                  </h3>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-extrabold font-mono">Real-time</span>
                </div>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRevenueHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `Rp ${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'}`}
                      />
                      <Tooltip
                        formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Package Distribution Chart */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4 flex flex-col justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Distribusi Paket WiFi
                </h3>

                {pieData.length > 0 ? (
                  <div className="space-y-4 my-auto">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Manual Legend */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] max-h-24 overflow-y-auto">
                      {pieData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="truncate">{item.name} ({item.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold">
                    Belum ada data distribusi produk WiFi.
                  </div>
                )}
              </div>
            </div>

            {/* Simulated WhatsApp automatic notification logs */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h4 className="font-bold text-sm text-yellow-400">Log Pengiriman WhatsApp Gateway Otomatis</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">Online</span>
              </div>
              <p className="text-[10px] text-slate-400">WhatsApp Gateway secara otomatis mengirimkan rincian status penagihan/verifikasi lunas kepada pelanggan. Berikut log real-time:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto font-mono text-[10px] divide-y divide-slate-800/60">
                {waLogs.length > 0 ? (
                  waLogs.map((log) => (
                    <div key={log.id} className="py-2 first:pt-0">
                      <span className="text-slate-500">[{log.time}]</span> <span className="text-blue-400">{log.phone}:</span>{' '}
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-500">Belum ada aktivitas pengiriman notifikasi WhatsApp otomatis.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATA PELANGGAN & MAP GEOGRAPHICAL DISTRIBUTION */}
        {activeTab === 'customers' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* GIS Map plot panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-3">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-5 h-5 text-blue-600" /> Plot Geografis Pemasangan Pelanggan
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Memetakan semua titik koordinat pelanggan Taranet menggunakan Leaflet Map OpenStreetMap.</p>
                </div>
                {selectedUserForMap && (
                  <div className="bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-bold py-1 px-2.5 rounded-lg">
                    Fokus: {selectedUserForMap.name}
                  </div>
                )}
              </div>
              <div id="admin-customers-map" className="w-full h-80 z-10" style={{ minHeight: '320px' }} />
            </div>

            {/* Search and Database Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Daftar Lengkap Pelanggan & Jalur WiFi
                </h3>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredCustomers.length === 0) return;
                      // Staggered trigger to prevent browser locks
                      filteredCustomers.forEach((c, idx) => {
                        setTimeout(() => {
                          generateCustomerPDFReport(c, supportTickets.filter((t) => t.userId === c.id), companySettings?.name);
                        }, idx * 300);
                      });
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-md shrink-0"
                    title="Cetak PDF Laporan Bulanan untuk Semua Pelanggan Terfilter"
                  >
                    <Download className="w-3.5 h-3.5" /> Cetak Laporan Massal ({filteredCustomers.length})
                  </button>
                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari nama, email atau telepon..."
                      className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs bg-slate-50/50"
                    />
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Nama Pelanggan</th>
                      <th className="py-3 px-4">Paket & Biaya</th>
                      <th className="py-3 px-4">Dokumen KTP</th>
                      <th className="py-3 px-4">Kontak / Alamat</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Laporan PDF</th>
                      <th className="py-3 px-4 text-right">Aksi & Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => {
                        const pkg = PACKAGES.find((p) => p.id === c.packageId) || PACKAGES[0];
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-4 font-bold text-slate-900">
                              <p className="text-sm">{c.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                            </td>
                            <td className="py-4 px-4 space-y-1">
                              <select
                                value={c.packageId}
                                onChange={(e) => {
                                  const newPkgId = e.target.value;
                                  const newPkgName = PACKAGES.find(p => p.id === newPkgId)?.name || newPkgId;
                                  setConfirmModal({
                                    show: true,
                                    title: 'Ubah Paket & Penyesuaian Tagihan',
                                    message: `Apakah Anda yakin ingin mengubah paket pelanggan "${c.name}" ke: ${newPkgName}? Tarif tagihan bulanan berjalan yang belum dibayar akan otomatis disesuaikan secara real-time.`,
                                    confirmText: 'Ya, Ubah Paket',
                                    variant: 'primary',
                                    onConfirm: async () => {
                                      await handleUpdateCustomerPackage(c.id, newPkgId);
                                      setSuccessToastMessage(`Paket ${c.name} berhasil diubah ke ${newPkgName} & tagihan disesuaikan!`);
                                      setTimeout(() => setSuccessToastMessage(null), 4000);
                                    }
                                  });
                                }}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white block focus:ring-2 focus:ring-blue-500 max-w-[170px]"
                                title="Ubah / Upgrade Paket Pelanggan"
                              >
                                {PACKAGES.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Rp {p.price.toLocaleString('id-ID')})
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-blue-600 font-mono font-bold pl-1">Rp {pkg.price.toLocaleString('id-ID')}/bln</p>
                            </td>
                            <td className="py-4 px-4">
                              {c.ktpImageUrl ? (
                                <a
                                  href={c.ktpImageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                                >
                                  Lihat KTP (Drive)
                                </a>
                              ) : (
                                <span className="text-slate-400">Tidak ada</span>
                              )}
                            </td>
                            <td className="py-4 px-4 space-y-1 max-w-[200px]">
                              <p className="font-mono text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                                <PhoneCall className="w-3 h-3 text-emerald-500" /> {c.phone}
                              </p>
                              <p className="truncate text-slate-500" title={c.address}>{c.address}</p>
                              <button
                                onClick={() => handleFocusOnMap(c)}
                                className="text-[9px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3 text-indigo-500" /> Lihat di Peta
                              </button>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${
                                c.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => generateCustomerPDFReport(c, supportTickets.filter((t) => t.userId === c.id), companySettings?.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-[10px] rounded-lg transition-all border border-slate-200/80 active:scale-95"
                                title="Cetak Laporan PDF untuk Pelanggan Ini"
                              >
                                <Download className="w-3 h-3 text-blue-600" /> Cetak PDF
                              </button>
                            </td>
                            <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                              <select
                                value={c.status}
                                onChange={async (e) => {
                                  await onUpdateCustomerStatus(c.id, e.target.value as any);
                                }}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white inline-block align-middle"
                              >
                                <option value="pending">Set Pending</option>
                                <option value="active">Set Active</option>
                                <option value="suspended">Set Suspended</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(c.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-block align-middle"
                                title="Hapus Pelanggan"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                          Pelanggan tidak ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFIKASI PEMBAYARAN TAGIHAN */}
        {activeTab === 'payments' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                Persetujuan Transaksi & Bukti Transfer Masuk
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Periode Tagihan</th>
                      <th className="py-3 px-4">Jumlah</th>
                      <th className="py-3 px-4">Bukti Transaksi</th>
                      <th className="py-3 px-4">Metode & Tanggal</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {customers.flatMap((c) =>
                      c.payments.map((p) => ({ customer: c, payment: p }))
                    ).length > 0 ? (
                      customers.flatMap((c) =>
                        c.payments.map((p) => {
                          const hasProof = !!p.proofOfPaymentUrl;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-slate-900">{c.name}</p>
                                <p className="text-[10px] text-slate-400">{c.phone}</p>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-800">{p.billingPeriod}</td>
                              <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">Rp {p.amount.toLocaleString('id-ID')}</td>
                              <td className="py-3.5 px-4">
                                {hasProof ? (
                                  <a
                                    href={p.proofOfPaymentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                                  >
                                    Lihat Bukti Transfer
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Belum diunggah</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-slate-700 uppercase">{p.method || 'QRIS'}</p>
                                <p className="text-[10px] text-slate-400">{p.date}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                                  p.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : p.status === 'pending_verification'
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {p.status === 'pending_verification' && (
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await onVerifyPayment(c.id, p.id);
                                        logWhatsAppNotification(c.phone, c.name, p.billingPeriod, p.amount);
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                    >
                                      <Check className="w-3 h-3" /> Setujui
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (onRejectPayment) {
                                          await onRejectPayment(c.id, p.id);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                    >
                                      Tolak
                                    </button>
                                  </div>
                                )}
                                {p.status === 'paid' && (
                                  <span className="text-emerald-600 font-bold text-[10px]">Verified Lunas ✓</span>
                                )}
                                {p.status === 'unpaid' && (
                                  <div className="flex flex-col gap-1 items-end">
                                    <span className="text-slate-400 italic mb-1 text-[10px]">Menunggu Pembayaran</span>
                                    <div className="flex flex-col sm:flex-row gap-1 justify-end">
                                      <button
                                        type="button"
                                        disabled={sendingReminderId === `${p.id}-before_due`}
                                        onClick={() => handleSendWhatsAppReminder(c.id, p.id, 'before_due')}
                                        className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 font-bold text-[9px] rounded-md transition-colors border border-blue-200 whitespace-nowrap"
                                        title="Kirim pengingat WhatsApp sebelum jatuh tempo"
                                      >
                                        {sendingReminderId === `${p.id}-before_due` ? 'Mengirim...' : 'WA Sebelum Jatuh Tempo'}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={sendingReminderId === `${p.id}-overdue`}
                                        onClick={() => handleSendWhatsAppReminder(c.id, p.id, 'overdue')}
                                        className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 font-bold text-[9px] rounded-md transition-colors border border-rose-200 whitespace-nowrap"
                                        title="Kirim peringatan keterlambatan pembayaran"
                                      >
                                        {sendingReminderId === `${p.id}-overdue` ? 'Mengirim...' : 'WA Keterlambatan'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                          Belum ada transaksi terekam.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPLAINTS / GANGGUAN SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                Pesan Masuk, Hubungi Kami & Tiket Gangguan Pelanggan
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Nama Pengirim</th>
                      <th className="py-3 px-4">Kontak</th>
                      <th className="py-3 px-4">Isi Pesan / Keluhan</th>
                      <th className="py-3 px-4">Tanggal Masuk</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {supportTickets.length > 0 ? (
                      supportTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{t.userName}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">{t.phone} <br /> <span className="text-slate-400 font-sans text-[10px]">{t.email}</span></td>
                          <td className="py-3.5 px-4 max-w-[300px] leading-relaxed text-slate-600">{t.message}</td>
                          <td className="py-3.5 px-4">{t.date}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${
                              t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 animate-pulse'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {t.status !== 'resolved' ? (
                              <button
                                onClick={() => handleResolveTicket(t.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition shadow-xs hover:shadow-md active:scale-95"
                              >
                                Selesaikan
                              </button>
                            ) : (
                              <span className="text-slate-400 font-bold text-[10px]">Selesai</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                          Tidak ada pesan masuk atau tiket keluhan saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WIFI PACKAGES MANAGEMENT */}
        {activeTab === 'packages' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" /> Kelola Paket Internet WiFi
              </h3>
              <p className="text-slate-500 leading-relaxed mt-2 text-xs">
                Tambah atau hapus paket layanan internet WiFi Anda secara real-time. Paket yang Anda kelola di sini akan langsung sinkron ke halaman depan, form pendaftaran pelanggan, serta menu pilihan paket berlangganan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Tambah Paket */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" /> Tambah Paket WiFi Baru
                </h4>
                <form onSubmit={handleAddPackage} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase text-[9px]">Nama Paket *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Taranet LITE 20 Mbps"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 uppercase text-[9px]">Kecepatan *</label>
                      <input
                        type="text"
                        placeholder="Contoh: 20 Mbps"
                        value={newPkgSpeed}
                        onChange={(e) => setNewPkgSpeed(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 uppercase text-[9px]">Harga Bulanan (Rp) *</label>
                      <input
                        type="number"
                        placeholder="Contoh: 175000"
                        value={newPkgPrice}
                        onChange={(e) => setNewPkgPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 uppercase text-[9px]">Tipe Paket</label>
                      <select
                        value={newPkgType}
                        onChange={(e) => setNewPkgType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-blue-500 outline-none"
                      >
                        <option value="home">Rumah / Residensial</option>
                        <option value="business">Bisnis / Cafe / Kantor</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 uppercase text-[9px]">Rekomendasi / Populer?</label>
                      <div className="flex items-center h-8">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={newPkgPopular}
                            onChange={(e) => setNewPkgPopular(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span>Ya, Pasang Lencana Populer</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase text-[9px]">Fitur Layanan (Satu per baris atau pisahkan dengan koma)</label>
                    <textarea
                      rows={3}
                      placeholder="Contoh:&#10;100% Fiber Optik Unlimited&#10;Ideal untuk 3-5 perangkat&#10;Upload & Download Simetris"
                      value={newPkgFeatures}
                      onChange={(e) => setNewPkgFeatures(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-blue-500 outline-none resize-none font-mono text-[11px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingPackage}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/10 active:scale-[0.98]"
                  >
                    {addingPackage ? 'Menambahkan...' : 'Simpan Paket WiFi'}
                  </button>
                </form>
              </div>

              {/* Daftar Paket yang Ada */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Paket WiFi Terdaftar ({packages.length})
                  </h4>
                  {onRefreshPackages && (
                    <button
                      type="button"
                      onClick={() => onRefreshPackages()}
                      className="p-1 text-slate-400 hover:text-blue-600 transition"
                      title="Refresh"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 bg-white rounded-2xl border transition-all relative flex flex-col justify-between ${
                        pkg.popular
                          ? 'border-yellow-400 shadow-md shadow-yellow-400/5 bg-gradient-to-br from-white to-yellow-50/10'
                          : 'border-slate-200 shadow-sm hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase mb-1.5 ${
                              pkg.type === 'business' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {pkg.type === 'business' ? 'Bisnis' : 'Residensial'}
                            </span>
                            {pkg.popular && (
                              <span className="inline-block px-2 py-0.5 rounded bg-yellow-400 text-slate-900 text-[8px] font-extrabold uppercase ml-1">
                                Populer
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="text-slate-300 hover:text-red-600 p-1 rounded transition"
                            title="Hapus Paket"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h5 className="font-extrabold text-sm text-slate-900 tracking-tight mt-1">
                          {pkg.name}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium">Speed: {pkg.speed}</p>

                        <p className="font-extrabold text-sm text-blue-600 mt-2">
                          Rp {pkg.price.toLocaleString('id-ID')}<span className="text-[10px] font-normal text-slate-400">/bln</span>
                        </p>

                        <div className="mt-3 space-y-1.5 border-t border-slate-50 pt-2">
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Fitur:</span>
                          {pkg.features && pkg.features.map((feat: string, fIdx: number) => (
                            <div key={fIdx} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COMPANY SETTINGS */}
        {activeTab === 'company_settings' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> Pengaturan Identitas Perusahaan & WiFi
              </h3>
              <p className="text-slate-500 leading-relaxed mt-2 text-xs">
                Ubah nama perusahaan WiFi, alamat, serta identitas visual logo Anda di sini. Perubahan ini akan langsung diperbarui ke seluruh halaman web portal pelanggan, kuitansi PDF, dan notifikasi pesan otomatis.
              </p>
            </div>

            <form onSubmit={handleSaveCompanySettings} className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Nama Perusahaan WiFi</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  placeholder="Contoh: Taranet WiFi"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Teks Logo Identitas Visual (Maksimal 2 Kata)</label>
                <input
                  type="text"
                  value={companyLogoTextInput}
                  onChange={(e) => setCompanyLogoTextInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  placeholder="Contoh: TARANET"
                  required
                />
                <p className="text-[10px] text-slate-400">Kata kedua dalam logo otomatis dihiasi dengan warna biru profesional.</p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Tagline Perusahaan (Di bawah Logo)</label>
                <input
                  type="text"
                  value={companyTaglineInput}
                  onChange={(e) => setCompanyTaglineInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  placeholder="Contoh: ULTRA BROADBAND"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Alamat Perusahaan / Kantor WiFi</label>
                <textarea
                  rows={3}
                  value={companyAddressInput}
                  onChange={(e) => setCompanyAddressInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  placeholder="Alamat lengkap kantor pusat..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Nomor WhatsApp Kontak Perusahaan (CS)</label>
                <input
                  type="text"
                  value={companyPhoneInput}
                  onChange={(e) => setCompanyPhoneInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  placeholder="Contoh: +62 899-3299-977"
                  required
                />
                <p className="text-[10px] text-slate-400">Nomor ini digunakan di navigasi atas, footer, tombol live chat bantuan, serta notifikasi WhatsApp otomatis.</p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Tanggal Jatuh Tempo Tagihan Bulanan (1 s.d 28)</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={companyBillingDateInput}
                  onChange={(e) => setCompanyBillingDateInput(Math.max(1, Math.min(28, parseInt(e.target.value, 10) || 20)))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold"
                  placeholder="Contoh: 20"
                  required
                />
                <p className="text-[10px] text-slate-400">Menentukan batas tanggal jatuh tempo pembayaran bulanan pelanggan.</p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Upload Logo Perusahaan</label>
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  {companyLogoUrlInput ? (
                    <img src={companyLogoUrlInput} alt="Logo Preview" className="h-12 w-12 object-contain rounded border bg-white p-1" />
                  ) : (
                    <div className="h-12 w-12 rounded border bg-white flex items-center justify-center text-slate-300 text-xs font-bold font-sans">
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
                            setCompanyLogoUrlInput(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Gunakan format PNG/JPG dengan resolusi persegi/lanskap.</p>
                  </div>
                  {companyLogoUrlInput && (
                    <button
                      type="button"
                      onClick={() => setCompanyLogoUrlInput('')}
                      className="px-2.5 py-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>

            {/* PROMO MANAGEMENT SECTION */}
            <div className="pt-8 border-t border-slate-100 space-y-6">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-600" /> Unggah & Kelola Promosi Perusahaan
                </h4>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Disini Anda bisa mengunggah gambar-gambar promo atau pamflet wifi Anda. Gambar ini akan langsung ditampilkan di halaman utama portal promosi pelanggan.
                </p>
              </div>

              {/* Form Upload Promo */}
              <form onSubmit={handleUploadPromo} className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col sm:flex-row items-center gap-4 max-w-xl">
                <div className="flex-1 w-full space-y-2">
                  <label className="block font-bold text-slate-700 uppercase text-[9px]">Pilih Gambar Promo Baru</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPromoImageBase64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    required
                  />
                  {promoImageBase64 && (
                    <div className="mt-3 relative w-32 aspect-[4/3] rounded-xl border overflow-hidden bg-white">
                      <img src={promoImageBase64} alt="Promo Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPromoImageBase64('')}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={uploadingPromo || !promoImageBase64}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition text-xs shrink-0 flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  {uploadingPromo ? 'Mengunggah...' : 'Unggah Promo'}
                </button>
              </form>

              {/* Promo Gallery Grid */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-800">Daftar Promo Aktif:</h5>
                {companySettings?.promos && companySettings.promos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {companySettings.promos.map((promo, idx) => (
                      <div key={idx} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm aspect-[4/3]">
                        <img src={promo} alt={`Promo ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeletePromo(idx)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition transform hover:scale-105"
                            title="Hapus Promo"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
                    Belum ada gambar promo terunggah. Silakan gunakan formulir di atas untuk mengunggah gambar promosi Anda.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AREA COVERAGE AREA MANAGEMENT */}
        {activeTab === 'coverage' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> Pengaturan Area Jangkauan / Cakupan WiFi
              </h3>
              <p className="text-slate-500 leading-relaxed mt-2 text-xs">
                Kelola daerah jangkauan internet WiFi Anda secara dinamis. Anda bisa menambah kota/kabupaten baru, mendaftarkan kecamatan, hingga mengaktifkan kelurahan/desa beserta status nodenya.
              </p>
            </div>

            {/* FORM ADD CITY/KABUPATEN */}
            <form onSubmit={handleAddCity} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col sm:flex-row items-end gap-3 max-w-2xl">
              <div className="flex-1 space-y-1 w-full">
                <label className="block font-bold text-slate-700 uppercase text-[9px]">Nama Kota / Kabupaten Baru</label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Contoh: Depok, Bogor, Bekasi"
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-blue-600 text-xs"
                  required
                />
              </div>
              <div className="space-y-1 w-full sm:w-40">
                <label className="block font-bold text-slate-700 uppercase text-[9px]">Tipe Wilayah</label>
                <select
                  value={newCityType}
                  onChange={(e) => setNewCityType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-blue-600 text-xs font-bold"
                >
                  <option value="Kota">Kota</option>
                  <option value="Kabupaten">Kabupaten</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-xs shrink-0"
              >
                Tambah Wilayah
              </button>
            </form>

            {loadingCoverage ? (
              <div className="py-12 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Memuat database area cakupan...</span>
              </div>
            ) : coverageList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                Belum ada area cakupan terdaftar. Silakan tambah kota/kabupaten di atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {coverageList.map((city) => (
                  <div key={city.cityName} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                    {/* City Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                      <div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider mr-2">
                          {city.regionType}
                        </span>
                        <strong className="text-sm text-slate-800 uppercase tracking-tight">{city.cityName}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCity(city.cityName)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Kota/Kabupaten ini"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Form Add Kecamatan */}
                      <div className="flex gap-2 max-w-md">
                        <input
                          type="text"
                          placeholder="Masukkan nama Kecamatan baru..."
                          value={newKecName[city.cityName] || ''}
                          onChange={(e) => setNewKecName(prev => ({ ...prev, [city.cityName]: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddKecamatan(city.cityName)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition text-xs shrink-0"
                        >
                          Tambah Kec.
                        </button>
                      </div>

                      {/* Kecamatan List */}
                      {city.kecamatans && city.kecamatans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {city.kecamatans.map((kec: any) => {
                            const kecKey = `${city.cityName}-${kec.name}`;
                            return (
                              <div key={kec.name} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                                  <strong className="text-slate-800 uppercase text-[10px]">Kecamatan {kec.name}</strong>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKecamatan(city.cityName, kec.name)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Form Add Kelurahan */}
                                <div className="flex gap-1.5 mb-3">
                                  <input
                                    type="text"
                                    placeholder="Kelurahan baru..."
                                    value={newKelName[kecKey] || ''}
                                    onChange={(e) => setNewKelName(prev => ({ ...prev, [kecKey]: e.target.value }))}
                                    className="flex-1 px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-blue-600 text-[10px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddKelurahan(city.cityName, kec.name)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[10px] shrink-0"
                                  >
                                    Tambah
                                  </button>
                                </div>

                                {/* Kelurahan Sub-list */}
                                {kec.kelurahans && kec.kelurahans.length > 0 ? (
                                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                    {kec.kelurahans.map((kel: any) => (
                                      <div key={kel.name} className="flex items-center justify-between px-2 py-1.5 bg-white border border-slate-200/50 rounded-lg text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          <span className="text-slate-700 font-medium">{kel.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {kel.nodesCount || 0} Nodes
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteKelurahan(city.cityName, kec.name, kel.name)}
                                            className="p-0.5 text-slate-400 hover:text-red-500 transition"
                                          >
                                            <Trash className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic">Belum ada kelurahan terdaftar.</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed">
                          Belum ada kecamatan terdaftar. Silakan tambah di atas.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Custom Confirmation Modal */}
    {confirmModal.show && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 text-left">
          <div className="text-slate-800 space-y-2">
            <h3 className={`font-extrabold text-sm uppercase tracking-wide ${
              confirmModal.variant === 'primary'
                ? 'text-blue-600'
                : confirmModal.variant === 'success'
                  ? 'text-emerald-600'
                  : 'text-red-600'
            }`}>{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-bold">{confirmModal.message}</p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={async () => {
                const currentConfirm = confirmModal.onConfirm;
                setConfirmModal(prev => ({ ...prev, show: false }));
                await currentConfirm();
              }}
              className={`px-4 py-2 text-white font-bold rounded-xl transition text-xs shadow-md ${
                confirmModal.variant === 'primary'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/15'
                  : confirmModal.variant === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/15'
              }`}
            >
              {confirmModal.confirmText || 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
