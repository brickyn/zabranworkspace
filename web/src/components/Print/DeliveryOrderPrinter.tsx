'use client';

import React, { forwardRef } from 'react';

interface DeliveryOrderItem {
  id: string;
  status: string;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    category?: string | null;
    condition?: string | null;
    grade?: string | null;
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
  ({ batchId, date, fromBranch, toBranch, items, notes, senderName = 'Gudang Zabran', companyName = 'ZABRAN WORKSPACES' }, ref) => {
    const dateStr = new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
      <div ref={ref} style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 15mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '3px solid #000', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px' }}>{companyName}</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555' }}>Sistem Manajemen Inventori & POS Terpadu</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1a56db' }}>SURAT JALAN</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', color: '#333' }}>
              No: {batchId}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555' }}>Tanggal: {dateStr}</p>
          </div>
        </div>

        {/* From / To */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '6px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dikirim Dari (Pengirim)</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>{fromBranch.name}</p>
            {fromBranch.address && <p style={{ margin: '0 0 2px 0', color: '#444', fontSize: '11px' }}>{fromBranch.address}</p>}
            {fromBranch.phone && <p style={{ margin: 0, color: '#444', fontSize: '11px' }}>Telp: {fromBranch.phone}</p>}
          </div>
          <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '6px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dikirim Kepada (Penerima)</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>{toBranch.name}</p>
            {toBranch.address && <p style={{ margin: '0 0 2px 0', color: '#444', fontSize: '11px' }}>{toBranch.address}</p>}
            {toBranch.phone && <p style={{ margin: 0, color: '#444', fontSize: '11px' }}>Telp: {toBranch.phone}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center', width: '30px', fontSize: '11px' }}>No</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'left', fontSize: '11px' }}>Nama Barang</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'left', fontSize: '11px', width: '80px' }}>ID / Kode</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'left', fontSize: '11px', width: '120px' }}>Serial Number</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center', fontSize: '11px', width: '70px' }}>Kondisi</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center', fontSize: '11px', width: '70px' }}>Diterima</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center', fontSize: '11px', width: '70px' }}>Ditolak</th>
              <th style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'left', fontSize: '11px', width: '120px' }}>Alasan Ditolak</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontSize: '11px' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', fontSize: '11px' }}>
                  <strong>{item.product.brand} {item.product.name}</strong>
                  {item.product.model && <span style={{ color: '#666', display: 'block', fontSize: '10px' }}>{item.product.model}</span>}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', fontSize: '10px', fontFamily: 'monospace' }}>{item.product.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', fontSize: '10px', fontFamily: 'monospace' }}>{item.product.serialNumber || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontSize: '11px' }}>{item.product.condition || item.product.grade || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontSize: '16px' }}>
                  {item.status === 'Received' ? '✓' : '☐'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontSize: '16px' }}>
                  {item.status === 'Returned' ? '✓' : '☐'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', fontSize: '10px', color: '#c00' }}>
                  {item.status === 'Returned' ? (item.notes || 'Ditolak') : ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'right', fontSize: '11px' }}>
                Total: {items.length} Unit
              </td>
              <td colSpan={3} style={{ border: '1px solid #ccc' }}></td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {notes && (
          <div style={{ marginBottom: '20px', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fffbeb' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>Catatan:</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#333' }}>{notes}</p>
          </div>
        )}

        {/* Summary Counts */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <div style={{ flex: 1, padding: '10px', border: '1px solid #d1fae5', borderRadius: '6px', backgroundColor: '#ecfdf5', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
              {items.filter(i => i.status === 'Received').length}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>Unit Diterima</div>
          </div>
          <div style={{ flex: 1, padding: '10px', border: '1px solid #fee2e2', borderRadius: '6px', backgroundColor: '#fef2f2', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
              {items.filter(i => i.status === 'Returned').length}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>Unit Diretur</div>
          </div>
          <div style={{ flex: 1, padding: '10px', border: '1px solid #dbeafe', borderRadius: '6px', backgroundColor: '#eff6ff', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
              {items.filter(i => i.status === 'Shipped').length}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>Pending</div>
          </div>
        </div>

        {/* Signature Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginTop: '10px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '11px' }}>Pengirim</p>
            <p style={{ margin: '0 0 60px 0', fontSize: '10px', color: '#666' }}>{senderName}</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
              <p style={{ margin: 0, fontSize: '10px' }}>Nama & Tanda Tangan</p>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '11px' }}>Penerima</p>
            <p style={{ margin: '0 0 60px 0', fontSize: '10px', color: '#666' }}>{toBranch.name}</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
              <p style={{ margin: 0, fontSize: '10px' }}>Nama & Tanda Tangan</p>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '11px' }}>Mengetahui</p>
            <p style={{ margin: '0 0 60px 0', fontSize: '10px', color: '#666' }}>Manager / Supervisor</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
              <p style={{ margin: 0, fontSize: '10px' }}>Nama & Tanda Tangan</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>
            Dokumen ini dicetak secara otomatis oleh sistem {companyName} — {batchId} — {dateStr}
          </p>
        </div>
      </div>
    );
  }
);

DeliveryOrderPrinter.displayName = 'DeliveryOrderPrinter';
export default DeliveryOrderPrinter;
