export interface TransactionPrintData {
  transactionId: string;
  date: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
  cash: number;
  change: number;
  cashierName?: string;
  customerName?: string;
  leadSource?: string;
  csName?: string;
}

// 58mm thermal printers usually have a max width of 32 characters per line.
const LINE_LENGTH = 32;

/**
 * Helper: formatLine
 * Formats a string to exactly 32 characters, with leftText on the left and rightText on the right.
 * If the combined length exceeds 31 characters, leftText is truncated to ensure rightText is visible.
 */
export const formatLine = (leftText: string, rightText: string): string => {
  const rightLen = rightText.length;
  
  if (rightLen >= LINE_LENGTH) {
    // Fallback if the right text itself is incredibly long
    return rightText.substring(0, LINE_LENGTH);
  }
  
  let left = leftText;
  // Ensure there is at least 1 space between left and right text
  const maxLeftLen = LINE_LENGTH - rightLen - 1; 
  
  if (left.length > maxLeftLen) {
    left = left.substring(0, maxLeftLen - 2) + '..';
  }
  
  const spaces = LINE_LENGTH - (left.length + rightText.length);
  return left + ' '.repeat(spaces > 0 ? spaces : 1) + rightText;
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

// ESC/POS Commands
const ESC = '\x1b';
const GS = '\x1d';

const COMMANDS = {
  INIT: ESC + '@', // Initialize printer
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  FEED: ESC + 'd' + '\x03', // Feed 3 lines
};

/**
 * Generates the raw ESC/POS byte buffer for the receipt.
 */
export const generateReceiptBuffer = (data: TransactionPrintData): Uint8Array => {
  let receipt = '';
  
  // Header
  receipt += COMMANDS.INIT;
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += COMMANDS.BOLD_ON;
  receipt += "ZIS ERP / ZPOS\n";
  receipt += COMMANDS.BOLD_OFF;
  receipt += "Jl. Zabran Tech No. 1\n"; // Update with real address
  receipt += "--------------------------------\n";
  
  // Meta
  receipt += COMMANDS.ALIGN_LEFT;
  receipt += `TRX : ${data.transactionId}\n`;
  receipt += `TGL : ${data.date}\n`;
  if (data.cashierName) receipt += `KSR : ${data.cashierName}\n`;
  if (data.customerName && data.customerName !== 'Walk-in Customer') {
    // Truncate customer name if it's too long to fit nicely on one line
    const name = data.customerName.length > 20 ? data.customerName.substring(0, 20) + '..' : data.customerName;
    receipt += `CUST: ${name}\n`;
  }
  receipt += "--------------------------------\n";
  
  // Items Body
  data.items.forEach(item => {
    // Line 1: Item Name (Truncated if necessary by formatLine if we put something on the right, but here we just print it)
    // Actually, to prevent wrap distortion, we ensure the name itself doesn't exceed 32 chars on its own line
    let itemName = item.name;
    if (itemName.length > LINE_LENGTH) {
      itemName = itemName.substring(0, LINE_LENGTH - 2) + '..';
    }
    receipt += itemName + '\n';
    
    // Line 2: Qty x Price aligned with Subtotal
    const leftText = `  ${item.qty}x ${formatCurrency(item.price)}`;
    const rightText = formatCurrency(item.subtotal);
    receipt += formatLine(leftText, rightText) + '\n';
  });
  
  // Totals Footer
  receipt += "--------------------------------\n";
  receipt += COMMANDS.BOLD_ON;
  receipt += formatLine("TOTAL", formatCurrency(data.total)) + '\n';
  receipt += COMMANDS.BOLD_OFF;
  receipt += formatLine("TUNAI", formatCurrency(data.cash)) + '\n';
  receipt += formatLine("KEMBALI", formatCurrency(data.change)) + '\n';
  receipt += "--------------------------------\n";
  
  // CRM & Outro Footer
  receipt += COMMANDS.ALIGN_CENTER;
  if (data.csName || data.leadSource) {
    receipt += `CS: ${data.csName || '-'} | SRC: ${data.leadSource || '-'}\n`;
  }
  receipt += "Terima Kasih Atas\nKunjungan Anda\n";
  
  // Feed to push paper out
  receipt += COMMANDS.FEED;
  receipt += "\n\n"; 
  
  // Convert string to Uint8Array buffer
  // Note: For basic thermal printing, mapping char codes to 8-bit ints works for ASCII/Latin-1.
  const buffer = new Uint8Array(receipt.length);
  for (let i = 0; i < receipt.length; i++) {
    buffer[i] = receipt.charCodeAt(i) & 0xFF;
  }
  
  return buffer;
};

/**
 * Connects to a Web Bluetooth thermal printer and streams the receipt data.
 */
export const connectAndPrint = async (data: TransactionPrintData): Promise<{ success: boolean; error?: string }> => {
  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      return { 
        success: false, 
        error: 'Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome di Desktop atau Android.' 
      };
    }

    // Request Bluetooth Device with BLE SPP / Generic Printer UUIDs
    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard BLE printer service
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', 
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455' // Common serial over BLE UUID
      ],
      // If filters are too strict for generic Chinese printers, we can fallback to acceptAllDevices in production
      // but acceptAllDevices requires optionalServices to be exhaustively listed.
      // acceptAllDevices: true 
    });

    if (!device.gatt) {
      return { success: false, error: 'GATT Server tidak ditemukan pada perangkat.' };
    }

    const server = await device.gatt.connect();

    // Find the primary service (fallback to grabbing the first available if standard fails)
    let service;
    try {
      service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    } catch (e) {
      const services = await server.getPrimaryServices();
      if (services.length === 0) {
        throw new Error('Tidak ada layanan Bluetooth yang ditemukan.');
      }
      service = services[0];
    }

    // Find a writable characteristic
    const characteristics = await service.getCharacteristics();
    const writeCharacteristic = characteristics.find((c: any) => 
      c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writeCharacteristic) {
      return { success: false, error: 'Karakteristik Write tidak ditemukan pada printer ini.' };
    }

    // Generate Payload
    const payload = generateReceiptBuffer(data);

    // Send payload in chunks. BLE often limits packets (MTU) to ~20 or ~512 bytes.
    // Chunking ensures the printer's buffer doesn't overflow.
    const CHUNK_SIZE = 100;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      
      if (writeCharacteristic.properties.writeWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
      
      // Small artificial delay to prevent hardware buffer overflow
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Disconnect gracefully
    device.gatt.disconnect();
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Bluetooth Print Error:', error);
    
    if (error.name === 'NotFoundError') {
      return { success: false, error: 'Koneksi dibatalkan oleh pengguna atau perangkat tidak ditemukan.' };
    }
    if (error.name === 'SecurityError') {
      return { success: false, error: 'Keamanan browser memblokir koneksi Bluetooth. Pastikan menggunakan HTTPS.' };
    }
    
    return { success: false, error: error.message || 'Gagal terhubung dan mencetak.' };
  }
};

/**
 * Generates raw ESC/POS byte buffer for End of Day Recap.
 */
export const generateEODReceiptBuffer = (
  session: any, 
  expected: { cash: number; qris: number; transfer: number }, 
  variances: { cash: number; qris: number; transfer: number }
): Uint8Array => {
  let receipt = '';
  
  receipt += COMMANDS.INIT;
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += COMMANDS.BOLD_ON;
  receipt += "ZIS ERP / ZPOS\n";
  receipt += COMMANDS.BOLD_OFF;
  receipt += "REKAPITULASI KASIR (EOD)\n";
  receipt += "--------------------------------\n";
  
  receipt += COMMANDS.ALIGN_LEFT;
  receipt += `TGL   : ${new Date().toLocaleDateString('id-ID')}\n`;
  receipt += `KASIR : ${session.openedById}\n`; // Ideally should be name, adjust as needed
  receipt += "--------------------------------\n";

  receipt += COMMANDS.BOLD_ON;
  receipt += "1. TUNAI / FISIK\n";
  receipt += COMMANDS.BOLD_OFF;
  receipt += formatLine("Modal Awal", formatCurrency(session.startingCash)) + '\n';
  receipt += formatLine("Sistem", formatCurrency(expected.cash)) + '\n';
  receipt += formatLine("Aktual", formatCurrency(session.actualCash)) + '\n';
  receipt += formatLine("Selisih", formatCurrency(variances.cash)) + '\n';
  receipt += "--------------------------------\n";

  receipt += COMMANDS.BOLD_ON;
  receipt += "2. QRIS\n";
  receipt += COMMANDS.BOLD_OFF;
  receipt += formatLine("Sistem", formatCurrency(expected.qris)) + '\n';
  receipt += formatLine("Aktual", formatCurrency(session.actualQris)) + '\n';
  receipt += formatLine("Selisih", formatCurrency(variances.qris)) + '\n';
  receipt += "--------------------------------\n";

  receipt += COMMANDS.BOLD_ON;
  receipt += "3. TRANSFER BANK\n";
  receipt += COMMANDS.BOLD_OFF;
  receipt += formatLine("Sistem", formatCurrency(expected.transfer)) + '\n';
  receipt += formatLine("Aktual", formatCurrency(session.actualTransfer)) + '\n';
  receipt += formatLine("Selisih", formatCurrency(variances.transfer)) + '\n';
  receipt += "--------------------------------\n";

  receipt += COMMANDS.ALIGN_CENTER;
  receipt += "Tanda Tangan Kasir\n\n\n\n";
  receipt += "________________________\n";
  
  receipt += COMMANDS.FEED;
  receipt += "\n\n";
  
  const buffer = new Uint8Array(receipt.length);
  for (let i = 0; i < receipt.length; i++) {
    buffer[i] = receipt.charCodeAt(i) & 0xFF;
  }
  
  return buffer;
};

/**
 * Connects to Web Bluetooth and prints the EOD receipt.
 */
export const printEndOfDay = async (
  session: any, 
  expected: { cash: number; qris: number; transfer: number }, 
  variances: { cash: number; qris: number; transfer: number }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      return { success: false, error: 'Web Bluetooth API tidak didukung di browser ini.' };
    }

    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', 
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    if (!device.gatt) return { success: false, error: 'GATT Server tidak ditemukan pada perangkat.' };

    const server = await device.gatt.connect();
    let service;
    try {
      service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    } catch (e) {
      const services = await server.getPrimaryServices();
      if (services.length === 0) throw new Error('Tidak ada layanan Bluetooth.');
      service = services[0];
    }

    const characteristics = await service.getCharacteristics();
    const writeCharacteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

    if (!writeCharacteristic) return { success: false, error: 'Karakteristik Write tidak ditemukan.' };

    const payload = generateEODReceiptBuffer(session, expected, variances);

    const CHUNK_SIZE = 100;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      if (writeCharacteristic.properties.writeWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    device.gatt.disconnect();
    return { success: true };
  } catch (error: any) {
    console.error('Bluetooth Print Error:', error);
    return { success: false, error: error.message || 'Gagal mencetak.' };
  }
};
