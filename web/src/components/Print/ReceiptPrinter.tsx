import React, { forwardRef } from 'react';

interface ReceiptPrinterProps {
  transaction: any;
  companyName?: string;
  companyAddress?: string;
  receiptFooter?: string;
  logoUrl?: string;
}

const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(({ transaction, companyName = 'ZABRAN STORE', companyAddress = 'Jl. Contoh Alamat No 123', receiptFooter = 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa bukti garansi.', logoUrl }, ref) => {
  if (!transaction) return null;

  const dateStr = new Date(transaction.createdAt || new Date()).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div ref={ref} className="p-4" style={{ width: '80mm', color: '#000', fontFamily: 'monospace', fontSize: '12px', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" style={{ maxWidth: '80px', maxHeight: '80px', marginBottom: '10px' }} />
        )}
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{companyName}</h2>
        <p style={{ margin: 0, fontSize: '10px' }}>{companyAddress}</p>
        <p style={{ margin: '5px 0 0 0' }}>--------------------------------</p>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div>Trx ID: {transaction.id}</div>
        <div>Tgl   : {dateStr}</div>
        <div>Kasir : {transaction.cashier?.name || 'Admin'}</div>
        { (transaction.customer?.name || transaction.customerName) && (
          <div>Plg   : {transaction.customer?.name || transaction.customerName} {transaction.customer?.phone || transaction.customerPhone ? `(${transaction.customer?.phone || transaction.customerPhone})` : ''}</div>
        )}
      </div>
      
      <p style={{ margin: '0 0 5px 0' }}>--------------------------------</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          {transaction.items?.map((item: any, idx: number) => (
            <React.Fragment key={idx}>
              <tr>
                <td colSpan={2} style={{ padding: '2px 0' }}>{item.productName || item.product?.name || item.productId}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0' }}>1x Rp {item.sellingPrice?.toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'right', padding: '2px 0' }}>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
              </tr>
              {item.discount > 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '0 0 2px 0', fontSize: '10px', fontStyle: 'italic' }}>
                    Disc: -Rp {item.discount.toLocaleString('id-ID')}
                  </td>
                </tr>
              )}
              {item.product?.durasiGaransi && item.product?.satuanGaransi && (
                <tr>
                  <td colSpan={2} style={{ padding: '0 0 2px 0', fontSize: '10px', color: '#555' }}>
                    Garansi: {item.product.durasiGaransi} {item.product.satuanGaransi}
                  </td>
                </tr>
              )}
              {item.product?.serialNumber && (
                <tr>
                  <td colSpan={2} style={{ padding: '0 0 2px 0', fontSize: '10px', color: '#555' }}>
                    SN: {item.product.serialNumber}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <p style={{ margin: '0 0 5px 0' }}>--------------------------------</p>

      <table style={{ width: '100%', fontWeight: 'bold' }}>
        <tbody>
          {transaction.discount > 0 && (
            <tr>
              <td>Total Disc</td>
              <td style={{ textAlign: 'right' }}>-Rp {transaction.discount.toLocaleString('id-ID')}</td>
            </tr>
          )}
          <tr>
            <td>TOTAL</td>
            <td style={{ textAlign: 'right' }}>Rp {transaction.totalAmount?.toLocaleString('id-ID')}</td>
          </tr>
          {transaction.paymentMethod === 'Split Bill' && transaction.splitPayments ? (
            <>
              <tr>
                <td colSpan={2} style={{ fontWeight: 'normal', paddingTop: '5px', paddingBottom: '2px' }}>Split Payment:</td>
              </tr>
              {transaction.splitPayments.map((sp: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 'normal', paddingLeft: '10px' }}>- {sp.method}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'normal' }}>Rp {sp.amount?.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </>
          ) : (
            <tr>
              <td style={{ fontWeight: 'normal', paddingTop: '5px' }}>Payment</td>
              <td style={{ textAlign: 'right', fontWeight: 'normal', paddingTop: '5px' }}>{transaction.paymentMethod}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
        <p style={{ margin: 0 }}>Terima Kasih Atas Kunjungan Anda</p>
        <p style={{ margin: '5px 0' }}>{receiptFooter}</p>
        <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>— Zabran Workspaces —</p>
      </div>
    </div>
  );
});

ReceiptPrinter.displayName = 'ReceiptPrinter';

export default ReceiptPrinter;
