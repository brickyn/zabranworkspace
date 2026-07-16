const XLSX = require('xlsx');

const headers = [
  "Tanggal", "Kode TX", "Cabang ID", "Nama Produk", "Kategori", "HPP", "Harga Jual", "Metode Bayar", "Kasir ID"
];

// Contoh Data (Mock)
const data = [
  ["2025-01-01", "TX-1001", "CAB-001", "iPhone 13 Pro", "Smartphone", 12000000, 15000000, "Cash", "USR-001"],
  ["2025-01-01", "TX-1002", "CAB-001", "MacBook Air M1", "Laptop", 10000000, 12500000, "BCA Transfer", "USR-002"],
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Template_Import");

XLSX.writeFile(wb, "public/Template_Import_ZIS.xlsx");
console.log("Template generated at public/Template_Import_ZIS.xlsx");
