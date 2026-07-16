import { create } from 'zustand';

export interface CartItem {
  id: string; // product id / serial number
  name: string;
  price: number;
  basePrice: number;
  discount: number;
  quantity: number; // For serial numbers, quantity is usually 1, but we keep it flexible
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  discountTotal: number;
  taxTotal: number;
  paymentMethod: string;
  promoCode: string;
  leadSource: string;
  closingType: string;
  
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  updateItemPrice: (id: string, price: number) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setPaymentMethod: (method: string) => void;
  setDiscountTotal: (discount: number) => void;
  setPromoCode: (code: string) => void;
  setLeadSource: (source: string) => void;
  setClosingType: (type: string) => void;
  clearCart: () => void;
  
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  discountTotal: 0,
  taxTotal: 0,
  paymentMethod: 'Cash',
  promoCode: '',
  leadSource: '',
  closingType: 'Offline',

  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.id === item.id);
    if (existing) {
      return { items: state.items };
    }
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  updateItemDiscount: (id, discount) => set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, discount } : item
    )
  })),

  updateItemPrice: (id, price) => set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, price } : item
    )
  })),

  setCustomerInfo: (customerName, customerPhone) => set({ customerName, customerPhone }),
  
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  
  setDiscountTotal: (discountTotal) => set({ discountTotal }),
  
  setPromoCode: (promoCode) => set({ promoCode }),
  
  setLeadSource: (leadSource) => set({ leadSource }),
  
  setClosingType: (closingType) => set({ closingType }),

  clearCart: () => set({ items: [], customerName: '', customerPhone: '', discountTotal: 0, taxTotal: 0, paymentMethod: 'Cash', promoCode: '', leadSource: '', closingType: 'Offline' }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const itemDiscounts = get().items.reduce((total, item) => total + item.discount, 0);
    return Math.max(0, subtotal - itemDiscounts - get().discountTotal + get().taxTotal);
  }
}));

