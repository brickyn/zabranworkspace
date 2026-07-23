'use client';

import React, { forwardRef } from 'react';

interface DeliveryOrderItem {
  id: string;
  status: string;
  notes?: string | null;
  qty?: number;
  productItem?: {
    sn?: string;
    product?: {
      id: string;
      name: string;
      brand?: string | null;
      model?: string | null;
      sku?: string | null;
      sellPrice?: number | null;
      price?: number | null;
    };
  };
  product?: {
    id: string;
    name: string;
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    sku?: string | null;
    sellPrice?: number | null;
    price?: number | null;
  };
}

interface DeliveryOrderPrinterProps {
  batchId: string;
  date: string;
  fromBranch: { name: string; address?: string | null; phone?: string | null };
  toBranch: { name: string; address?: string | null; phone?: string | null };
  items: DeliveryOrderItem[];
  notes?: string | null;
  senderName?: string;
  companyName?: string;
}

const DeliveryOrderPrinter = forwardRef<HTMLDivElement, DeliveryOrderPrinterProps>(
  ({ batchId, date, fromBranch, toBranch, items, notes, companyName = 'Zabran Internasional Grup' }, ref) => {
    const formatDateIndonesian = (dateInput: string) => {
      try {
        const d = new Date(dateInput);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const dayName = days[d.getDay()] || '';
        const dateNum = d.getDate();
        const monthName = months[d.getMonth()] || '';
        const year = d.getFullYear();
        return `${dayName}, ${dateNum} ${monthName} ${year}`;
      } catch (e) {
        return date;
      }
    };

    return (
      <div ref={ref} style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 15mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          {/* Left Company Info */}
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#000' }}>{companyName}</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#333' }}>Email: pt.zabraninternasional@gmail.com</p>
            <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: '#333' }}>Telp: +6288218171011</p>
            <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: '#333', maxWidth: '340px', lineHeight: '1.3' }}>
              {fromBranch?.address || 'Jl. Perintis No.1, Sarijadi, Kec. Sukasari, Kota Bandung, Jawa Barat 40151'}
            </p>
          </div>

          {/* Right Metadata Header */}
          <div style={{ textAlign: 'left', fontSize: '11px', minWidth: '220px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '1px 4px', color: '#333', width: '60px' }}>Perihal</td>
                  <td style={{ padding: '1px 4px' }}>: Distribusi</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 4px', color: '#333' }}>Asal</td>
                  <td style={{ padding: '1px 4px', fontWeight: 'bold' }}>: {fromBranch?.name || companyName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 4px', color: '#333' }}>Tujuan</td>
                  <td style={{ padding: '1px 4px', fontWeight: 'bold' }}>: {toBranch?.name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 4px', color: '#333' }}>Tanggal</td>
                  <td style={{ padding: '1px 4px' }}>: {formatDateIndonesian(date)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Title Center */}
        <div style={{ textAlign: 'center', margin: '20px 0 15px 0' }}>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>SURAT JALAN</h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{batchId}</p>
        </div>

        {/* Table Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fff', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
              <th style={{ border: '1px solid #333', padding: '6px 4px', textAlign: 'center', width: '30px', fontSize: '11px' }}>No</th>
              <th style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'left', width: '140px', fontSize: '11px' }}>Kode Barang</th>
              <th style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'left', fontSize: '11px' }}>Nama Barang</th>
              <th style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'left', width: '150px', fontSize: '11px' }}>Keterangan</th>
              <th style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'right', width: '90px', fontSize: '11px' }}>Harga Jual</th>
              <th style={{ border: '1px solid #333', padding: '6px 4px', textAlign: 'center', width: '35px', fontSize: '11px' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const prod = item.productItem?.product || item.product || {};
              const kodeBarang = prod.sku || item.productItem?.sn || prod.id || '-';
              const namaBarang = `${prod.brand ? prod.brand + ' ' : ''}${prod.name || 'Laptop'} ${prod.model ? prod.model + ' ' : ''}${item.productItem?.sn ? item.productItem.sn + ' ' : ''}`.trim();
              const priceVal = prod.sellPrice || prod.price || 0;
              const hargaFormatted = priceVal > 0 ? new Intl.NumberFormat('id-ID').format(priceVal) : '0';

              return (
                <tr key={item.id || idx}>
                  <td style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', fontSize: '10px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '5px 8px', fontSize: '10px', fontFamily: 'monospace' }}>
                    {kodeBarang} <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>✓</span>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '5px 8px', fontSize: '10px' }}>
                    {namaBarang}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '5px 8px', fontSize: '10px' }}>
                    {item.notes || '+ Charger ✓'}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>
                    {hargaFormatted}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', fontSize: '10px' }}>
                    {item.qty || 1}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Notes if any */}
        {notes && (
          <div style={{ marginBottom: '15px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '10px' }}>
            <strong>Catatan Tambahan:</strong> {notes}
          </div>
        )}

        {/* Bottom Signatures (3 Columns matching photo) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 10px' }}>
          <div style={{ textAlign: 'center', width: '30%' }}>
            <p style={{ margin: '0 0 55px 0', fontWeight: 'bold', fontSize: '11px' }}>Mengetahui,</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
              <p style={{ margin: 0, fontSize: '10px' }}>Ttd & Nama Jelas Tim Gudang</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '30%' }}>
            <p style={{ margin: '0 0 55px 0', fontWeight: 'bold', fontSize: '11px' }}>Diserahkan Oleh,</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
              <p style={{ margin: 0, fontSize: '10px' }}>Ttd & Nama Jelas Tim Distribusi</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '30%' }}>
            <p style={{ margin: '0 0 55px 0', fontWeight: 'bold', fontSize: '11px' }}>Diterima Oleh,</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
              <p style={{ margin: 0, fontSize: '10px' }}>Ttd & Nama Jelas Tim Outlet</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DeliveryOrderPrinter.displayName = 'DeliveryOrderPrinter';
export default DeliveryOrderPrinter;
