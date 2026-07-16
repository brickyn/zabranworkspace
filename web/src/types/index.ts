export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  division?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  permissions?: string[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
}

export interface Product {
  id: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  sku?: string | null;
  barcode?: string | null;
  serialNumber?: string | null;
  status: string;
  purchasePrice: number;
  sellingPrice: number;
  promoPrice?: number | null;
  condition?: string | null;
  grade?: string | null;
  branchId: string;
  branch?: Branch;
}

export interface StockTransferItem {
  id: string;
  transferOrderId: string;
  productId: string;
  status: string;
  notes?: string | null;
  product?: Product;
}

export interface TransferOrder {
  id: string;
  transferNumber: string;
  doNumber?: string | null;
  fromBranchId?: string | null;
  toBranchId: string;
  status: string;
  notes?: string | null;
  dispatchDate?: string | null;
  createdAt: string;
  updatedAt: string;
  
  fromBranch?: Branch;
  toBranch?: Branch;
  items?: StockTransferItem[];
}
