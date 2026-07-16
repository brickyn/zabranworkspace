import { Request, Response } from 'express';
/**
 * Import historical transactions from Excel
 * POST /api/v1/data-import/transactions
 * Excel columns: Tanggal, Kode TX, Cabang ID, Nama Produk, Harga Jual, HPP, Metode Bayar, Kasir ID
 */
export declare const importTransactions: (req: Request, res: Response) => Promise<void>;
/**
 * Import products from Excel
 * POST /api/v1/data-import/products
 * Excel columns: ID Produk, Nama, Brand, Model, Kategori, Processor, RAM, Storage, GPU, HPP, Harga Jual, Cabang ID, Status, Serial Number
 */
export declare const importProducts: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=dataImport.controller.d.ts.map