import React, { forwardRef } from 'react';

interface ReceiptPrinterProps {
  transaction: any;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  receiptFooter?: string;
  logoUrl?: string;
}

const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(({
  transaction,
  companyName = 'ZABRAN STORE',
  companyAddress = 'Jl. Contoh Alamat No 123',
  companyPhone,
  receiptFooter = 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa bukti garansi.',
  logoUrl
}, ref) => {
  if (!transaction) return null;

  const dateStr = new Date(transaction.createdAt || new Date()).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const line = '--------------------------------';

  // Helper: resolve product name from nested structure
  const getProductName = (item: any): string => {
    // From createTransaction response: items.productItem.product
    const p = item.productItem?.product;
    if (p) {
      return `${p.brand || ''} ${p.name || ''} ${p.model || ''}`.trim();
    }
    // Fallback for other response shapes
    return item.productName || item.product?.name || item.productId || '-';
  };

  const getSN = (item: any): string | null => {
    return item.productItem?.sn || item.product?.serialNumber || null;
  };

  const getWarranty = (item: any): string | null => {
    const p = item.productItem?.product || item.product;
    if (p?.durasiGaransi && p?.satuanGaransi) {
      return `${p.durasiGaransi} ${p.satuanGaransi}`;
    }
    return null;
  };

  const customerName = transaction.customer?.name || transaction.customerName;
  const customerPhone = transaction.customer?.phone || transaction.customerPhone;

  return (
    <div ref={ref} style={{ width: '80mm', color: '#000', fontFamily: 'monospace', fontSize: '12px', background: '#fff', padding: '10px 8px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" style={{ maxWidth: '70px', maxHeight: '70px', marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
        )}
        <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px' }}>{companyName}</div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>{companyAddress}</div>
        {companyPhone && <div style={{ fontSize: '10px' }}>Telp: {companyPhone}</div>}
        <div style={{ margin: '6px 0 0' }}>{line}</div>
      </div>

      {/* Transaction Info */}
      <div style={{ marginBottom: '6px', fontSize: '11px' }}>
        <div>No    : {transaction.id}</div>
        <div>Tgl   : {dateStr}</div>
        <div>Kasir : {transaction.cashier?.name || 'Admin'}</div>
        {customerName && (
          <div>Plgn  : {customerName}{customerPhone ? ` (${customerPhone})` : ''}</div>
        )}
      </div>

      <div>{line}</div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
        <tbody>
          {transaction.items?.map((item: any, idx: number) => {
            const productName = getProductName(item);
            const sn = getSN(item);
            const warranty = getWarranty(item);
            const qty = item.qty || 1;
            const price = item.sellingPrice || item.price || 0;
            const disc = item.discount || 0;
            const subtotal = item.subtotal ?? (price * qty - disc);

            return (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan={2} style={{ padding: '3px 0 1px', fontWeight: 'bold', fontSize: '11px' }}>
                    {productName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', fontSize: '11px' }}>{qty}x Rp {price.toLocaleString('id-ID')}</td>
                  <td style={{ textAlign: 'right', padding: '1px 0', fontSize: '11px' }}>Rp {subtotal.toLocaleString('id-ID')}</td>
                </tr>
                {disc > 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0 0 2px', fontSize: '10px', fontStyle: 'italic', color: '#555' }}>
                      Diskon: -Rp {disc.toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
                {sn && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0 0 2px', fontSize: '10px', color: '#555' }}>
                      SN: {sn}
                    </td>
                  </tr>
                )}
                {warranty && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0 0 4px', fontSize: '10px', color: '#555' }}>
                      Garansi: {warranty}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <div>{line}</div>

      {/* Totals */}
      <table style={{ width: '100%', margin: '6px 0', fontSize: '11px' }}>
        <tbody>
          {transaction.discount > 0 && (
            <tr>
              <td>Total Diskon</td>
              <td style={{ textAlign: 'right' }}>-Rp {transaction.discount.toLocaleString('id-ID')}</td>
            </tr>
          )}
          <tr>
            <td style={{ fontWeight: 'bold', fontSize: '13px' }}>TOTAL</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              Rp {transaction.totalAmount?.toLocaleString('id-ID')}
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: '4px' }}>Metode</td>
            <td style={{ textAlign: 'right', paddingTop: '4px' }}>{transaction.paymentMethod}</td>
          </tr>
          {/* Split payments detail */}
          {transaction.paymentMethod === 'Split Bill' && Array.isArray(transaction.splitPayments) && (
            transaction.splitPayments.map((sp: any, i: number) => (
              <tr key={i}>
                <td style={{ paddingLeft: '8px', fontSize: '10px' }}>• {sp.method}</td>
                <td style={{ textAlign: 'right', fontSize: '10px' }}>Rp {sp.amount?.toLocaleString('id-ID')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div>{line}</div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
        <div>Terima Kasih Atas Kunjungan Anda!</div>
        {receiptFooter && <div style={{ margin: '4px 0', fontStyle: 'italic' }}>{receiptFooter}</div>}
        <div style={{ marginTop: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>— {companyName} —</div>
      </div>
    </div>
  );
});

ReceiptPrinter.displayName = 'ReceiptPrinter';

export default ReceiptPrinter;
