import React, { forwardRef } from 'react';

interface ReceiptPrinterProps {
  transaction: any;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  receiptHeader?: string;      // Extra header line below store name
  receiptThankyou?: string;    // Thank you greeting above footer
  receiptFooter?: string;      // Disclaimer at bottom
  logoUrl?: string;
  receiptWidth?: string;       // '58mm' | '80mm' | '210mm'
}

const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(({
  transaction,
  companyName = 'ZABRAN STORE',
  companyAddress = 'Jl. Contoh Alamat No 123',
  companyPhone,
  receiptHeader,
  receiptThankyou = 'Terima Kasih Atas Kunjungan Anda!',
  receiptFooter = 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa bukti garansi.',
  logoUrl,
  receiptWidth = '80mm',
}, ref) => {
  if (!transaction) return null;

  const dateStr = new Date(transaction.createdAt || new Date()).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Determine paper width in px (for screen preview)
  const widthMap: Record<string, string> = {
    '58mm': '58mm',
    '80mm': '80mm',
    '210mm': '210mm',
  };
  const paperWidth = widthMap[receiptWidth] || '80mm';

  const line = '--------------------------------';

  // Helper: resolve product name from nested structure
  const getProductName = (item: any): string => {
    const p = item.productItem?.product;
    if (p) {
      return [p.brand, p.name, p.model].filter(Boolean).join(' ');
    }
    return item.productName || item.product?.name || item.productId || '-';
  };

  const getSN = (item: any): string | null => {
    return item.productItem?.sn || item.product?.serialNumber || null;
  };

  const customerName = transaction.customer?.name || transaction.customerName;
  const customerPhone = transaction.customer?.phone || transaction.customerPhone;

  const fontSizeBase = receiptWidth === '58mm' ? '10px' : '12px';
  const fontSizeTitle = receiptWidth === '58mm' ? '13px' : '15px';
  const fontSizeTotal = receiptWidth === '58mm' ? '11px' : '13px';

  return (
    <div
      ref={ref}
      style={{
        width: paperWidth,
        color: '#000',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: fontSizeBase,
        background: '#fff',
        padding: receiptWidth === '210mm' ? '20px 30px' : '10px 8px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            style={{ maxWidth: '80px', maxHeight: '80px', display: 'block', margin: '0 auto 8px' }}
          />
        )}
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {companyName}
        </div>
        {receiptHeader && (
          <div style={{ fontSize: fontSizeBase, marginTop: '2px', color: '#333' }}>{receiptHeader}</div>
        )}
        {companyAddress && (
          <div style={{ fontSize: '10px', marginTop: '2px', color: '#444' }}>{companyAddress}</div>
        )}
        {companyPhone && (
          <div style={{ fontSize: '10px', color: '#444' }}>Telp: {companyPhone}</div>
        )}
        <div style={{ margin: '6px 0 0' }}>{line}</div>
      </div>

      {/* Transaction Info */}
      <div style={{ marginBottom: '6px' }}>
        <table style={{ width: '100%', fontSize: fontSizeBase }}>
          <tbody>
            <tr>
              <td style={{ whiteSpace: 'nowrap', paddingRight: '4px' }}>No</td>
              <td>: <strong>{transaction.id}</strong></td>
            </tr>
            <tr>
              <td style={{ whiteSpace: 'nowrap', paddingRight: '4px' }}>Tgl</td>
              <td>: {dateStr}</td>
            </tr>
            <tr>
              <td style={{ whiteSpace: 'nowrap', paddingRight: '4px' }}>Kasir</td>
              <td>: {transaction.cashier?.name || 'Admin'}</td>
            </tr>
            {customerName && (
              <tr>
                <td style={{ whiteSpace: 'nowrap', paddingRight: '4px' }}>Plgn</td>
                <td>: {customerName}{customerPhone ? ` (${customerPhone})` : ''}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>{line}</div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
        <tbody>
          {transaction.items?.map((item: any, idx: number) => {
            const productName = getProductName(item);
            const sn = getSN(item);
            const qty = item.qty || 1;
            const price = item.sellingPrice || item.price || 0;
            const disc = item.discount || 0;
            const subtotal = item.subtotal ?? (price * qty - disc);

            return (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan={2} style={{ paddingTop: idx > 0 ? '6px' : '3px', paddingBottom: '1px', fontWeight: 'bold' }}>
                    {productName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0' }}>{qty}x Rp {price.toLocaleString('id-ID')}</td>
                  <td style={{ textAlign: 'right', padding: '1px 0' }}>Rp {subtotal.toLocaleString('id-ID')}</td>
                </tr>
                {disc > 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0 0 1px', fontSize: '10px', fontStyle: 'italic' }}>
                      Diskon: -Rp {disc.toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
                {sn && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0 0 1px', fontSize: '10px', color: '#555' }}>
                      SN: {sn}
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
      <table style={{ width: '100%', margin: '6px 0' }}>
        <tbody>
          {transaction.discount > 0 && (
            <tr>
              <td>Total Diskon</td>
              <td style={{ textAlign: 'right' }}>-Rp {transaction.discount.toLocaleString('id-ID')}</td>
            </tr>
          )}
          <tr>
            <td style={{ fontWeight: 'bold', fontSize: fontSizeTotal }}>TOTAL</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: fontSizeTotal }}>
              Rp {transaction.totalAmount?.toLocaleString('id-ID')}
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: '3px' }}>Metode</td>
            <td style={{ textAlign: 'right', paddingTop: '3px' }}>{transaction.paymentMethod}</td>
          </tr>
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
        {receiptThankyou && (
          <div style={{ fontStyle: 'italic', color: '#b45309', marginBottom: '4px' }}>{receiptThankyou}</div>
        )}
        {receiptFooter && (
          <div style={{ fontStyle: 'italic', color: '#555', marginBottom: '6px' }}>{receiptFooter}</div>
        )}
        <div style={{ fontWeight: 'bold', letterSpacing: '1px', marginTop: '6px' }}>— {companyName} —</div>
      </div>
    </div>
  );
});

ReceiptPrinter.displayName = 'ReceiptPrinter';

export default ReceiptPrinter;
