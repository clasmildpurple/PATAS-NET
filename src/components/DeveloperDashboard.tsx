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

  const handleCopyAppsScript = () => {
    const scriptCode = `/**
 * Google Apps Script Web App Template
 * Copy and deploy this code in script.google.com as a Web App to integrate Google Sheets & Drive!
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Save to Google Sheets
    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone,
      data.address,
      data.coordinates ? data.coordinates.join(', ') : '',
      data.packageId,
      data.rentStb ? 'Yes' : 'No'
    ]);
    
    // If KTP Image Base64 is sent, save to Google Drive
    if (data.ktpImageBase64) {
      var folder = DriveApp.getFoldersByName("Taranet_KTP_Uploads");
      var targetFolder = folder.hasNext() ? folder.next() : DriveApp.createFolder("Taranet_KTP_Uploads");
      
      var base64Data = data.ktpImageBase64.split(",")[1];
      var contentType = data.ktpImageBase64.split(",")[0].split(":")[1].split(";")[0];
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, contentType, "KTP_" + data.name + ".jpg");
      
      var file = targetFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileUrl: file ? file.getUrl() : "" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(scriptCode);
    alert('Kode Google Apps Script disalin ke clipboard! Silakan buka script.google.com dan buat Web App baru.');
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
