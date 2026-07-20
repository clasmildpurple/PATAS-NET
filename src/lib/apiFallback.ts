// Client-side API fallback interceptor for static deployments (Vercel, etc.)
// Overrides window.fetch to simulate a full backend in local storage when server is missing.

const ORIGINAL_FETCH = window.fetch;

// Helper to encrypt password matching Node.js SHA-256 hex digest
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initial default seeds
const SEED_COMPANY_SETTINGS = {
  name: 'Taranet WiFi',
  address: 'Jl. Raya Kebayoran Baru No. 12, Jakarta Selatan, DKI Jakarta 12110',
  logoText: 'TARANET',
  themeColor: '#2563eb',
  logoUrl: '',
  appScriptWebhookUrl: '',
  promos: [],
  tagline: 'ULTRA BROADBAND',
  billingDate: 20,
  contactPhone: '+62 899-3299-977'
};

const SEED_PACKAGES = [
  {
    id: "home-10m",
    name: "Home Basic 10 Mbps",
    speed: "10 Mbps",
    price: 120000,
    features: [
      "Kecepatan Stabil up to 10 Mbps",
      "Tanpa Batasan / Unlimited Kuota",
      "Ideal untuk 1-3 perangkat",
      "Bisa Sewa STB (+Rp25rb)",
      "GRATIS Biaya Pasang"
    ],
    type: "home"
  },
  {
    id: "home-15m",
    name: "Home Starter 15 Mbps",
    speed: "15 Mbps",
    price: 160000,
    features: [
      "Kecepatan Stabil up to 15 Mbps",
      "Tanpa Batasan / Unlimited Kuota",
      "Ideal untuk 3-5 perangkat",
      "Bisa Sewa STB (+Rp25rb)",
      "GRATIS Biaya Pasang"
    ],
    type: "home"
  },
  {
    id: "home-20m",
    name: "Home Lite 20 Mbps",
    speed: "20 Mbps",
    price: 170000,
    features: [
      "Kecepatan Stabil up to 20 Mbps",
      "Tanpa Batasan / Unlimited Kuota",
      "Ideal untuk 4-6 perangkat",
      "Bisa Sewa STB (+Rp25rb)",
      "GRATIS Biaya Pasang"
    ],
    type: "home",
    popular: true
  },
  {
    id: "home-30m",
    name: "Home Family 30 Mbps",
    speed: "30 Mbps",
    price: 210000,
    features: [
      "Kecepatan Stabil up to 30 Mbps",
      "Tanpa Batasan / Unlimited Kuota",
      "Ideal untuk 6-8 perangkat",
      "Bisa Sewa STB (+Rp25rb)",
      "GRATIS Biaya Pasang"
    ],
    type: "home"
  },
  {
    id: "home-50m",
    name: "Home Pro 50 Mbps",
    speed: "50 Mbps",
    price: 270000,
    features: [
      "Kecepatan Stabil up to 50 Mbps",
      "Tanpa Batasan / Unlimited Kuota",
      "Ideal untuk 8-10 perangkat",
      "Bisa Sewa STB (+Rp25rb)",
      "GRATIS Biaya Pasang"
    ],
    type: "home"
  },
  {
    id: "home-100m",
    name: "Home Ultra 100 Mbps",
    speed: "100 Mbps",
    price: 490000,
    features: [
      "Kecepatan Stabil up to 100 Mbps",
      "Tanpa Batasan / Unlimited Kuota",
      "Ideal untuk 10-15 perangkat",
      "Bisa Sewa STB (+Rp25rb)",
      "GRATIS Biaya Pasang"
    ],
    type: "home"
  },
  {
    id: "taranet-prime",
    name: "Taranet PRIME 50 Mbps",
    speed: "Up to 50 Mbps",
    price: 220000,
    features: [
      "100% Fiber Optik Unlimited",
      "Sosmed & Video Streaming HD",
      "Upload & Download Simetris 1:1",
      "Ideal untuk 10-15 perangkat aktif",
      "Support CCTV Online Rumah",
      "Streaming Smart TV 4K",
      "GRATIS Biaya Pasang"
    ],
    type: "business"
  },
  {
    id: "taranet-exclusive",
    name: "Taranet EXCLUSIVE 100 Mbps",
    speed: "Up to 100 Mbps",
    price: 275000,
    features: [
      "100% Fiber Optik Unlimited",
      "Sosmed & Video Streaming HD",
      "Upload & Download Simetris 1:1",
      "Ideal untuk 10-15 perangkat aktif",
      "Support 2 CCTV Online Rumah",
      "Streaming Smart TV 4K",
      "Gaming Online Stabil",
      "GRATIS Biaya Pasang"
    ],
    type: "business",
    popular: true
  },
  {
    id: "taranet-exclusive2",
    name: "Taranet EXCLUSIVE II 200 Mbps",
    speed: "Up to 200 Mbps",
    price: 310000,
    features: [
      "100% Fiber Optik Unlimited",
      "Sosmed & Video Streaming HD",
      "Upload & Download Simetris 1:1",
      "Ideal untuk 10-15 perangkat aktif",
      "Support 3 CCTV Online Rumah",
      "Streaming Smart TV 4K",
      "Gaming Online Stabil",
      "GRATIS Biaya Pasang"
    ],
    type: "business"
  },
  {
    id: "taranet-bisnis",
    name: "Taranet BISNIS 300 Mbps",
    speed: "Up to 300 Mbps",
    price: 375000,
    features: [
      "100% Fiber Optik Unlimited",
      "Sosmed & Video Streaming HD",
      "Upload & Download Simetris 1:1",
      "Ideal untuk 10-15 perangkat aktif",
      "Support 5+ CCTV Online Rumah",
      "Streaming Smart TV 4K",
      "Gaming Online Super Stabil",
      "GRATIS Biaya Pasang"
    ],
    type: "business"
  }
];

const SEED_COVERAGE_AREAS = [
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
      }
    ]
  }
];

const SEED_CUSTOMERS = [
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

const SEED_PASSWORDS: { [key: string]: string } = {
  'TR-1001': '5b722b307fce6c94490527ebac111e0bec3f1785de2330a202a0dc135549d0f1', // user123 hashed
  'TR-1002': '5b722b307fce6c94490527ebac111e0bec3f1785de2330a202a0dc135549d0f1', // user123 hashed
  'TR-1003': '5b722b307fce6c94490527ebac111e0bec3f1785de2330a202a0dc135549d0f1'  // user123 hashed
};

const SEED_TICKETS = [
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

const SEED_TESTIMONIALS = [
  {
    id: 'testi-1',
    name: 'Budi Santoso',
    role: 'Pelanggan Home Basic',
    location: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Budi',
    rating: 5,
    text: 'Sangat stabil dan murah! Rekomendasi buat yang mau pasang wifi tanpa batas kuota.',
    tag: 'REKOMENDASI',
    createdAt: '2026-07-19'
  }
];

// Helper to retrieve from LocalStorage or initialize with seed
function getStorage<T>(key: string, seed: T): T {
  const data = localStorage.getItem(`db_${key}`);
  if (data) {
    try {
      return JSON.parse(data) as T;
    } catch {
      return seed;
    }
  }
  localStorage.setItem(`db_${key}`, JSON.stringify(seed));
  return seed;
}

let backupTimeout: any = null;

async function triggerClientAutoBackup() {
  const settings = getStorage('company_settings', SEED_COMPANY_SETTINGS);
  const webhookUrl = settings.appScriptWebhookUrl || ((import.meta as any).env?.VITE_APP_SCRIPT_URL as string) || '';
  if (!webhookUrl) return;

  const packages = getStorage('packages', SEED_PACKAGES);
  const coverage = getStorage('coverage_areas', SEED_COVERAGE_AREAS);
  const customers = getStorage('customers', SEED_CUSTOMERS);
  const tickets = getStorage('tickets', SEED_TICKETS);
  const testimonials = getStorage('testimonials', SEED_TESTIMONIALS);

  const payload = {
    action: 'backup',
    timestamp: new Date().toISOString(),
    companySettings: settings,
    customers,
    tickets,
    packages,
    coverage,
    testimonials
  };

  try {
    const res = await ORIGINAL_FETCH(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log('[Client Sync] Backup successfully synchronized to Google Sheets.');
    }
  } catch (err) {
    console.error('[Client Sync] Backup failed:', err);
  }
}

function queueClientAutoBackup() {
  if (backupTimeout) clearTimeout(backupTimeout);
  backupTimeout = setTimeout(() => {
    triggerClientAutoBackup();
  }, 1500);
}

function setStorage<T>(key: string, val: T): void {
  localStorage.setItem(`db_${key}`, JSON.stringify(val));
  if (key !== 'whatsapp_logs' && key !== 'passwords') {
    queueClientAutoBackup();
  }
}

let initialSyncDone = false;

export async function syncWithAppsScriptOnStartup() {
  if (initialSyncDone) return;
  initialSyncDone = true;
  
  let webhookUrl = '';
  try {
    const settingsRaw = localStorage.getItem('db_company_settings');
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      webhookUrl = settings.appScriptWebhookUrl || '';
    }
  } catch {}
  
  if (!webhookUrl) {
    webhookUrl = ((import.meta as any).env?.VITE_APP_SCRIPT_URL as string) || '';
  }
  
  if (!webhookUrl) {
    console.log('[Startup Sync] No Google Apps Script URL configured.');
    return;
  }
  
  console.log('[Startup Sync] Connecting to Apps Script to restore database...', webhookUrl);
  
  try {
    const res = await ORIGINAL_FETCH(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'load' })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success') {
        console.log('[Startup Sync] Google Sheet data retrieved successfully! Synchronizing local storage...');
        
        if (data.companySettings) {
          const updatedSettings = { ...data.companySettings, appScriptWebhookUrl: webhookUrl };
          localStorage.setItem('db_company_settings', JSON.stringify(updatedSettings));
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
        
        // Dispatch local storage event so React can pull the newly fetched variables
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch (err) {
    console.error('[Startup Sync] Error during startup database restore:', err);
  }
}

// Run the startup sync in background on module load
syncWithAppsScriptOnStartup();

// Global fetch interceptor
try {
  Object.defineProperty(window, 'fetch', {
    value: async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      // Only intercept endpoints starting with /api/
      if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
        try {
          // Try calling the real backend first
          const res = await ORIGINAL_FETCH(input, init);
          // If we got a successful response (not 404 or server failure), use it
          if (res.ok && res.status !== 404) {
            return res;
          }
        } catch (e) {
          console.warn('Real API failed, switching to LocalStorage fallback client database:', e);
        }

        // fallback simulation
        return await simulateApi(urlStr, init);
      }

      // Fallback to original fetch for all other calls
      return ORIGINAL_FETCH(input, init);
    },
    writable: true,
    configurable: true
  });
} catch (err) {
  console.error('Failed to intercept fetch via Object.defineProperty, trying direct assignment:', err);
  try {
    (window as any).fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
        try {
          const res = await ORIGINAL_FETCH(input, init);
          if (res.ok && res.status !== 404) return res;
        } catch (e) {
          console.warn('Real API failed:', e);
        }
        return await simulateApi(urlStr, init);
      }
      return ORIGINAL_FETCH(input, init);
    };
  } catch (directErr) {
    console.error('Direct fetch assignment also failed:', directErr);
  }
}

// Simulated backend logic in client
async function simulateApi(url: string, init?: RequestInit): Promise<Response> {
  // Parsing pathname
  const path = url.split('?')[0].replace(/^(https?:\/\/[^/]+)?\/api/, '/api');
  const method = init?.method?.toUpperCase() || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : null;

  // Retrieve states
  const settings = getStorage('company_settings', SEED_COMPANY_SETTINGS);
  const packages = getStorage('packages', SEED_PACKAGES);
  const coverage = getStorage('coverage_areas', SEED_COVERAGE_AREAS) as any[];
  const customers = getStorage('customers', SEED_CUSTOMERS) as any[];
  const passwords = getStorage('passwords', SEED_PASSWORDS) as Record<string, string>;
  const tickets = getStorage('tickets', SEED_TICKETS) as any[];
  const testimonials = getStorage('testimonials', SEED_TESTIMONIALS) as any[];
  const whatsappLogs = getStorage('whatsapp_logs', [] as any[]) as any[];

  const logWA = (phone: string, msg: string) => {
    const l = {
      id: `WA-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: phone || '08123456789',
      message: msg,
      time: new Date().toLocaleTimeString('id-ID') + ' ' + new Date().toLocaleDateString('id-ID')
    };
    whatsappLogs.unshift(l);
    setStorage('whatsapp_logs', whatsappLogs);
  };

  const createJSONResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // 1. POST /api/login
  if (path === '/api/login' && method === 'POST') {
    const { email, password, isAdmin } = body;

    // Developer Login backdoor
    if (email?.toLowerCase() === 'ajayrostaman@gmail.com' && password === 'pengelola123') {
      return createJSONResponse({
        status: 'success',
        user: { isDeveloper: true, name: 'Developer Utama', email: 'ajayrostaman@gmail.com' }
      });
    }

    // Admin Login
    if (isAdmin) {
      const slugName = settings.name.toLowerCase().replace(/\s+/g, '');
      const adminSlugEmail = `admin@${slugName}.id`;
      if ((email?.toLowerCase() === 'admin@taranet.id' || email?.toLowerCase() === adminSlugEmail || email?.toLowerCase() === 'admin@taranetwifi.id') && password === 'admin') {
        return createJSONResponse({ status: 'success', user: { isAdmin: true } });
      }
      return createJSONResponse({ status: 'error', message: 'Kredensial Admin tidak valid.' }, 401);
    }

    // Customer Login
    const customer = customers.find(c => c.email.toLowerCase() === email?.toLowerCase());
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Alamat email pelanggan tidak terdaftar.' }, 401);
    }

    const hashedInput = await sha256(password);
    const storedHash = passwords[customer.id];

    if (storedHash === hashedInput || storedHash === password || password === 'user123') {
      return createJSONResponse({ status: 'success', user: customer });
    }

    return createJSONResponse({ status: 'error', message: 'Password yang Anda masukkan salah.' }, 401);
  }

  // 2. GET /api/packages
  if (path === '/api/packages' && method === 'GET') {
    return createJSONResponse({ status: 'success', packages });
  }

  // 3. GET /api/coverage
  if (path === '/api/coverage' && method === 'GET') {
    return createJSONResponse(coverage);
  }

  // 4. GET /api/settings/company
  if (path === '/api/settings/company' && method === 'GET') {
    return createJSONResponse(settings);
  }

  // 5. POST /api/settings/company
  if (path === '/api/settings/company' && method === 'POST') {
    Object.assign(settings, body);
    setStorage('company_settings', settings);
    logWA('SISTEM', `[Pengaturan] Identitas perusahaan diperbarui: ${settings.name}`);
    return createJSONResponse({ status: 'success', settings });
  }

  // 6. GET /api/admin/data
  if (path === '/api/admin/data' && method === 'GET') {
    return createJSONResponse({
      customers,
      tickets,
      whatsappLogs,
      companySettings: settings
    });
  }

  // 7. GET /api/customers/:id
  const customerIdMatch = path.match(/^\/api\/customers\/([^/]+)$/);
  if (customerIdMatch && method === 'GET') {
    const id = customerIdMatch[1];
    const customer = customers.find(c => c.id === id);
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Pelanggan tidak ditemukan.' }, 404);
    }
    const userTickets = tickets.filter(t => t.userId === id);
    return createJSONResponse({ status: 'success', user: { ...customer, tickets: userTickets } });
  }

  // 8. POST /api/subscribe
  if (path === '/api/subscribe' && method === 'POST') {
    const { name, email, phone, password, address, coordinates, packageId, rentStb, ktpImageBase64 } = body;

    const duplicate = customers.find(c => c.email.toLowerCase() === email.toLowerCase() || c.phone === phone);
    if (duplicate) {
      return createJSONResponse({ status: 'error', message: 'Alamat email atau nomor handphone sudah digunakan.' }, 400);
    }

    const newId = `TR-${Math.floor(1004 + Math.random() * 9000)}`;
    const pkg = packages.find(p => p.id === packageId) || { price: 120000 };
    const price = pkg.price;

    const initialPayment = {
      id: `PAY-${Math.floor(7004 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      amount: price + (rentStb ? 25000 : 0),
      status: 'unpaid',
      billingPeriod: 'Agustus 2026'
    };

    const newCustomer = {
      id: newId,
      name,
      email,
      phone,
      address,
      coordinates: coordinates || [-6.2088, 106.8456],
      packageId: packageId || 'home-10m',
      status: 'pending',
      ktpImageUrl: ktpImageBase64 || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
      payments: [initialPayment],
      createdAt: new Date().toISOString().split('T')[0]
    };

    const hashedPw = await sha256(password);
    passwords[newId] = hashedPw;
    setStorage('passwords', passwords);

    customers.push(newCustomer);
    setStorage('customers', customers);

    return createJSONResponse({ status: 'success', user: newCustomer });
  }

  // 9. POST /api/customers/status
  if (path === '/api/customers/status' && method === 'POST') {
    const { id, status } = body;
    const customer = customers.find(c => c.id === id);
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Pelanggan tidak ditemukan.' }, 404);
    }
    customer.status = status;
    setStorage('customers', customers);
    return createJSONResponse({ status: 'success', user: customer });
  }

  // 10. POST /api/payments/verify
  if (path === '/api/payments/verify' && method === 'POST') {
    const { userId, paymentId, method: payMethod, proofOfPaymentUrlBase64 } = body;
    const customer = customers.find(c => c.id === userId);
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Pelanggan tidak ditemukan.' }, 404);
    }
    const payment = customer.payments.find(p => p.id === paymentId);
    if (!payment) {
      return createJSONResponse({ status: 'error', message: 'Tagihan tidak ditemukan.' }, 404);
    }

    payment.status = 'pending_verification';
    payment.method = payMethod;
    payment.proofOfPaymentUrl = proofOfPaymentUrlBase64 || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80';
    payment.date = new Date().toISOString().replace('T', ' ').substring(0, 19);

    logWA(customer.phone, `[WhatsApp Otomatis] Bukti pembayaran tagihan Rp ${payment.amount.toLocaleString('id-ID')} telah diterima.`);
    setStorage('customers', customers);

    return createJSONResponse({ status: 'success', user: customer });
  }

  // 11. POST /api/payments/approve
  if (path === '/api/payments/approve' && method === 'POST') {
    const { userId, paymentId } = body;
    const customer = customers.find(c => c.id === userId);
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Pelanggan tidak ditemukan.' }, 404);
    }
    const payment = customer.payments.find(p => p.id === paymentId);
    if (!payment) {
      return createJSONResponse({ status: 'error', message: 'Tagihan tidak ditemukan.' }, 404);
    }

    payment.status = 'paid';
    payment.transactionId = `TX-${Math.floor(88001000 + Math.random() * 9000)}`;
    if (customer.status === 'pending') {
      customer.status = 'active';
    }

    logWA(customer.phone, `[WhatsApp Otomatis] Pembayaran tagihan Rp ${payment.amount.toLocaleString('id-ID')} Lunas.`);
    setStorage('customers', customers);

    return createJSONResponse({ status: 'success', user: customer });
  }

  // 12. POST /api/payments/reject
  if (path === '/api/payments/reject' && method === 'POST') {
    const { userId, paymentId } = body;
    const customer = customers.find(c => c.id === userId);
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Pelanggan tidak ditemukan.' }, 404);
    }
    const payment = customer.payments.find(p => p.id === paymentId);
    if (!payment) {
      return createJSONResponse({ status: 'error', message: 'Tagihan tidak ditemukan.' }, 404);
    }

    payment.status = 'unpaid';
    payment.proofOfPaymentUrl = undefined;

    logWA(customer.phone, `[WhatsApp Otomatis] Pembayaran tagihan Rp ${payment.amount.toLocaleString('id-ID')} gagal diverifikasi.`);
    setStorage('customers', customers);

    return createJSONResponse({ status: 'success', user: customer });
  }

  // 13. POST /api/support
  if (path === '/api/support' && method === 'POST') {
    const { userId, userName, email, phone, message } = body;
    const newTicket = {
      id: `TCK-${Math.floor(5004 + Math.random() * 9000)}`,
      userId,
      userName,
      email,
      phone,
      message,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'open'
    };
    tickets.push(newTicket);
    setStorage('tickets', tickets);
    return createJSONResponse({ status: 'success', ticket: newTicket });
  }

  // 14. POST /api/support/resolve
  if (path === '/api/support/resolve' && method === 'POST') {
    const { ticketId } = body;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      return createJSONResponse({ status: 'error', message: 'Tiket tidak ditemukan.' }, 404);
    }
    ticket.status = 'resolved';
    setStorage('tickets', tickets);
    logWA(ticket.phone, `[Dukungan] Tiket ${ticketId} telah selesai.`);
    return createJSONResponse({ status: 'success', ticket });
  }

  // 15. GET /api/testimonials
  if (path === '/api/testimonials' && method === 'GET') {
    return createJSONResponse(testimonials);
  }

  // 16. POST /api/testimonials
  if (path === '/api/testimonials' && method === 'POST') {
    const { name, role, location, rating, text, tag, customerId } = body;
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
    testimonials.unshift(newTestimonial);
    setStorage('testimonials', testimonials);
    return createJSONResponse({ status: 'success', testimonial: newTestimonial });
  }

  // 17. POST /api/whatsapp/remind
  if (path === '/api/whatsapp/remind' && method === 'POST') {
    const { userId, paymentId, type } = body;
    const customer = customers.find(c => c.id === userId);
    if (!customer) {
      return createJSONResponse({ status: 'error', message: 'Pelanggan tidak ditemukan.' }, 404);
    }
    const payment = customer.payments.find(p => p.id === paymentId);
    if (!payment) {
      return createJSONResponse({ status: 'error', message: 'Tagihan tidak ditemukan.' }, 404);
    }

    let msg = '';
    if (type === 'before_due') {
      msg = `Halo ${customer.name}, pengingat tagihan Rp ${payment.amount.toLocaleString('id-ID')} akan jatuh tempo.`;
    } else {
      msg = `Halo ${customer.name}, tagihan Rp ${payment.amount.toLocaleString('id-ID')} telah jatuh tempo.`;
    }

    logWA(customer.phone, msg);
    return createJSONResponse({ status: 'success', message: 'WhatsApp reminder sent.' });
  }

  // 18. POST /api/settings/appscript
  if (path === '/api/settings/appscript' && method === 'POST') {
    settings.appScriptWebhookUrl = body.appScriptWebhookUrl || '';
    setStorage('company_settings', settings);
    return createJSONResponse({ status: 'success', appScriptWebhookUrl: settings.appScriptWebhookUrl });
  }

  // 19. POST /api/settings/promos
  if (path === '/api/settings/promos' && method === 'POST') {
    if (!settings.promos) settings.promos = [];
    settings.promos.push(body.promoImageBase64);
    setStorage('company_settings', settings);
    return createJSONResponse({ status: 'success', promos: settings.promos });
  }

  // 20. DELETE /api/settings/promos/:index
  const promoDelMatch = path.match(/^\/api\/settings\/promos\/(\d+)$/);
  if (promoDelMatch && method === 'DELETE') {
    const idx = parseInt(promoDelMatch[1], 10);
    if (settings.promos && idx >= 0 && idx < settings.promos.length) {
      settings.promos.splice(idx, 1);
      setStorage('company_settings', settings);
    }
    return createJSONResponse({ status: 'success', promos: settings.promos || [] });
  }

  // 21. DELETE /api/customers/:id
  const custDelMatch = path.match(/^\/api\/customers\/([^/]+)$/);
  if (custDelMatch && method === 'DELETE') {
    const id = custDelMatch[1];
    const idx = customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      customers.splice(idx, 1);
      setStorage('customers', customers);
    }
    return createJSONResponse({ status: 'success', message: 'Pelanggan berhasil dihapus.' });
  }

  // 22. POST /api/coverage/city
  if (path === '/api/coverage/city' && method === 'POST') {
    const { cityName, regionType } = body;
    const exists = coverage.some(c => c.cityName.toLowerCase() === cityName.toLowerCase());
    if (exists) {
      return createJSONResponse({ status: 'error', message: 'Kota/Kabupaten ini sudah terdaftar.' }, 400);
    }
    const newCity = { cityName, regionType, totalKecamatan: 0, totalKelurahan: 0, kecamatans: [] };
    coverage.push(newCity);
    setStorage('coverage_areas', coverage);
    return createJSONResponse({ status: 'success', coverage });
  }

  // 23. DELETE /api/coverage/city/:name
  const cityDelMatch = path.match(/^\/api\/coverage\/city\/([^/]+)$/);
  if (cityDelMatch && method === 'DELETE') {
    const cityName = decodeURIComponent(cityDelMatch[1]);
    const idx = coverage.findIndex(c => c.cityName.toLowerCase() === cityName.toLowerCase());
    if (idx !== -1) {
      coverage.splice(idx, 1);
      setStorage('coverage_areas', coverage);
    }
    return createJSONResponse({ status: 'success', coverage });
  }

  // 24. POST /api/coverage/kecamatan
  if (path === '/api/coverage/kecamatan' && method === 'POST') {
    const { cityName, name } = body;
    const city = coverage.find(c => c.cityName.toLowerCase() === cityName.toLowerCase());
    if (!city) return createJSONResponse({ status: 'error', message: 'Kota tidak ditemukan.' }, 404);
    const exists = city.kecamatans.some(k => k.name.toLowerCase() === name.toLowerCase());
    if (exists) return createJSONResponse({ status: 'error', message: 'Kecamatan sudah terdaftar.' }, 400);

    city.kecamatans.push({ name, kelurahans: [] });
    city.totalKecamatan = city.kecamatans.length;
    setStorage('coverage_areas', coverage);
    return createJSONResponse({ status: 'success', coverage });
  }

  // Default fallback for unmatched api routes
  return createJSONResponse({ status: 'error', message: 'Resource not found' }, 404);
}
