'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import {
  Settings as SettingsIcon, Save, Loader2, Store, Receipt, Percent,
  ImageIcon, AlignLeft, Ruler, Phone, MapPin, Type
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ReceiptPrinter from '@/components/Print/ReceiptPrinter';
import { useReactToPrint } from 'react-to-print';

const FIELD_LABEL: Record<string, string> = {
  STORE_NAME: 'Nama Toko',
  STORE_PHONE: 'Nomor Telepon Toko',
  STORE_ADDRESS: 'Alamat Toko',
  STORE_LOGO: 'URL Logo (https://...)',
  TAX_RATE: 'Default Tax Rate (%)',
  RECEIPT_HEADER: 'Teks Header Tambahan',
  RECEIPT_THANKYOU: 'Ucapan Terima Kasih',
  RECEIPT_FOOTER: 'Catatan / Disclaimer Nota',
  RECEIPT_WIDTH: 'Lebar Kertas',
};

const RECEIPT_WIDTHS = [
  { label: '58mm (Mini Thermal)', value: '58mm' },
  { label: '80mm (Standar Thermal)', value: '80mm' },
  { label: 'A4 (Penuh)', value: '210mm' },
];

const DEFAULT_SETTINGS = {
  STORE_NAME: 'Zabran Enterprise',
  STORE_PHONE: '',
  STORE_ADDRESS: '',
  STORE_LOGO: '',
  TAX_RATE: '11',
  RECEIPT_HEADER: '',
  RECEIPT_THANKYOU: 'Terima Kasih Atas Kunjungan Anda!',
  RECEIPT_FOOTER: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa bukti garansi.',
  RECEIPT_WIDTH: '80mm',
};

const PREVIEW_TRANSACTION = {
  id: '2607270001',
  createdAt: new Date().toISOString(),
  cashier: { name: 'Kasir Demo' },
  customer: { name: 'Budi Santoso', phone: '081234567890' },
  paymentMethod: 'Cash',
  totalAmount: 2985000,
  discount: 0,
  items: [
    {
      qty: 1,
      sellingPrice: 1985000,
      discount: 0,
      subtotal: 1985000,
      productItem: {
        sn: 'SN-ABC123',
        product: {
          brand: 'Acer',
          name: 'Aspire ES1-132',
          model: 'ES1-132',
          durasiGaransi: 12,
          satuanGaransi: 'Bulan',
        }
      }
    },
    {
      qty: 1,
      sellingPrice: 1000000,
      discount: 0,
      subtotal: 1000000,
      productItem: {
        sn: 'SN-XYZ999',
        product: {
          brand: 'Asus',
          name: 'VivoBook',
          model: 'X441',
          durasiGaransi: 6,
          satuanGaransi: 'Bulan',
        }
      }
    }
  ]
};

function SectionCard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-glass-bg border border-glass-border rounded-3xl p-6 space-y-4">
      <h2 className={`text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-glass-border`}>
        <span className={color}>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-muted ml-1">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrintPreview = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Preview Nota',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role !== 'Super Admin') {
      toast.error('Unauthorized. Super Admin only.');
      router.push('/hub');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await apiClient.post('/settings', settings);
      if (res.data.success) {
        toast.success('Pengaturan berhasil disimpan!');
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-black/30 border border-glass-border rounded-xl text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all text-sm';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-12 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-blue-500" />
              Global Settings
            </h1>
            <p className="text-muted mt-1 text-sm">Konfigurasi sistem, template nota, dan pengaturan toko.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all font-semibold"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Semua
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Settings Forms */}
          <div className="xl:col-span-2 space-y-5">

            {/* Store Info */}
            <SectionCard icon={<Store className="w-5 h-5" />} title="Informasi Toko" color="text-purple-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nama Toko">
                  <input name="STORE_NAME" value={settings.STORE_NAME || ''} onChange={handleChange} className={inputCls} placeholder="Zabran Store" />
                </Field>
                <Field label="Nomor Telepon">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input name="STORE_PHONE" value={settings.STORE_PHONE || ''} onChange={handleChange} className={inputCls + ' pl-9'} placeholder="08xx-xxxx-xxxx" />
                  </div>
                </Field>
              </div>
              <Field label="Alamat Toko">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea name="STORE_ADDRESS" value={settings.STORE_ADDRESS || ''} onChange={handleChange} rows={2} className={inputCls + ' pl-9 resize-none'} placeholder="Jl. Contoh No. 123, Kota" />
                </div>
              </Field>
              <Field label="URL Logo Toko (https://...)">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input name="STORE_LOGO" value={settings.STORE_LOGO || ''} onChange={handleChange} className={inputCls + ' pl-9'} placeholder="https://domain.com/logo.png" />
                </div>
              </Field>
              {settings.STORE_LOGO && (
                <div className="flex items-center gap-3 mt-2 p-3 bg-white/5 rounded-xl border border-glass-border">
                  <img src={settings.STORE_LOGO} alt="Logo preview" className="h-12 w-12 object-contain rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <span className="text-xs text-gray-400">Preview logo. Akan tampil di header nota.</span>
                </div>
              )}
            </SectionCard>

            {/* Receipt Customization */}
            <SectionCard icon={<Receipt className="w-5 h-5" />} title="Kustomisasi Nota / Struk" color="text-emerald-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Lebar Kertas Nota">
                  <select name="RECEIPT_WIDTH" value={settings.RECEIPT_WIDTH || '80mm'} onChange={handleChange} className={inputCls}>
                    {RECEIPT_WIDTHS.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tax Rate Default (%)">
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input name="TAX_RATE" type="number" value={settings.TAX_RATE || ''} onChange={handleChange} className={inputCls + ' pl-9'} placeholder="11" />
                  </div>
                </Field>
              </div>

              <Field label="Teks Header Tambahan (opsional, tampil di bawah nama toko)">
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input name="RECEIPT_HEADER" value={settings.RECEIPT_HEADER || ''} onChange={handleChange} className={inputCls + ' pl-9'} placeholder="e.g. Service Center Resmi · 0822-xxxx-xxxx" />
                </div>
              </Field>

              <Field label="Ucapan Terima Kasih (header footer nota)">
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input name="RECEIPT_THANKYOU" value={settings.RECEIPT_THANKYOU || ''} onChange={handleChange} className={inputCls + ' pl-9'} placeholder="Terima Kasih Atas Kunjungan Anda!" />
                </div>
              </Field>

              <Field label="Catatan / Disclaimer (bagian bawah nota)">
                <textarea name="RECEIPT_FOOTER" value={settings.RECEIPT_FOOTER || ''} onChange={handleChange} rows={3} className={inputCls + ' resize-none'} placeholder="Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa bukti garansi." />
              </Field>

              <button
                type="button"
                onClick={() => handlePrintPreview()}
                className="w-full py-2.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                🖨️ Cetak Nota Preview (Test)
              </button>
            </SectionCard>
          </div>

          {/* Right: Live Receipt Preview */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-3">
              <div className="bg-glass-bg border border-glass-border rounded-3xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Preview Nota (Live)
                </h3>
                <div className="overflow-auto max-h-[75vh] bg-white rounded-2xl flex justify-center p-3">
                  <ReceiptPrinter
                    ref={receiptRef}
                    transaction={PREVIEW_TRANSACTION}
                    companyName={settings.STORE_NAME || 'Zabran Store'}
                    companyAddress={settings.STORE_ADDRESS}
                    companyPhone={settings.STORE_PHONE}
                    receiptHeader={settings.RECEIPT_HEADER}
                    receiptThankyou={settings.RECEIPT_THANKYOU}
                    receiptFooter={settings.RECEIPT_FOOTER}
                    logoUrl={settings.STORE_LOGO}
                    receiptWidth={settings.RECEIPT_WIDTH || '80mm'}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Preview diperbarui secara langsung saat Anda mengetik</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
