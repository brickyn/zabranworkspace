export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  processor?: string | null;
  ram?: string | null;
  storage?: string | null;
  gpu?: string | null;
  screenSize?: string | null;
  condition?: string | null;
  grade?: string | null;
  completeness?: string | null;
  description?: string | null;
  buyPrice: number;
  sellPrice: number;
  promoPrice?: number | null;
  status: string;
  imageUrl?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductInput = Partial<CreateProductInput>;
