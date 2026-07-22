'use client';

import { useState, useEffect } from 'react';

import { Search, ScanBarcode, Trash2, CreditCard, Banknote, Wallet, User, Phone, CheckCircle2, Loader2, ShoppingCart, Tag, Clock, PauseCircle, PlayCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrinter from '@/components/Print/ReceiptPrinter';
import { useSession } from '@/modules/zpos/components/SessionContext';
import { Lock } from 'lucide-react';

export default function POSPage() {
  const { session, isSessionLoading, setShowOpenSession } = useSession();
  
  const [searchInput, setSearchInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>({});
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: receiptRef, // Pass the RefObject here, react-to-print v3 changed content to contentRef
    documentTitle: `Receipt_${lastTransaction?.id || 'Zabran'}`,
  });
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [promos, setPromos] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [splitPayments, setSplitPayments] = useState([
    { method: 'Cash', amount: 0 }, 
    { method: 'Transfer', amount: 0 }
  ]);

  const { 
    items, addItem, removeItem, updateQuantity, updateItemDiscount, updateItemPrice,
    customerName, customerPhone, setCustomerInfo,
    paymentMethod, setPaymentMethod,
    getSubtotal, getTotal, clearCart,
    discountTotal, setDiscountTotal, promoCode, setPromoCode,
    leadSource, closingType, setLeadSource, setClosingType
  } = useCartStore();
  
  const [voucherInput, setVoucherInput] = useState('');
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  // Hold Transaction State
  const [heldTransactions, setHeldTransactions] = useState<any[]>([]);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Conditional Approval State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overridePassword, setOverridePassword] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchPromos();
    fetchSysSettings();
    const storedHeld = localStorage.getItem('held_transactions');
    if (storedHeld) {
      try {
        setHeldTransactions(JSON.parse(storedHeld));
      } catch (e) {}
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input (except search which we want to focus)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      switch(e.key) {
        case 'F1':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'F2':
          e.preventDefault();
          if (items.length > 0) handleCheckout();
          break;
        case 'F3':
          e.preventDefault();
          if (items.length > 0) handleHoldTransaction();
          break;
        case 'F4':
          e.preventDefault();
          setShowHeldModal(true);
          break;
        case 'F8':
          e.preventDefault();
          if (items.length > 0 && confirm('Clear cart?')) handleNewTransaction();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, customerName, customerPhone, paymentMethod]);

  const saveHeldTransactions = (held: any[]) => {
    setHeldTransactions(held);
    localStorage.setItem('held_transactions', JSON.stringify(held));
  };

  const handleHoldTransaction = () => {
    if (items.length === 0) return;
    const newHold = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...items],
      customerName,
      customerPhone,
      paymentMethod,
      discountTotal,
      promoCode,
      notes,
      total: getTotal()
    };
    saveHeldTransactions([...heldTransactions, newHold]);
    toast.success('Transaction held successfully');
    handleNewTransaction();
  };

  const handleResumeTransaction = (holdId: string) => {
    const held = heldTransactions.find(h => h.id === holdId);
    if (!held) return;
    
    // Resume to cart
    clearCart();
    held.items.forEach((item: any) => addItem(item));
    setCustomerInfo(held.customerName || '', held.customerPhone || '');
    setPaymentMethod(held.paymentMethod);
    setDiscountTotal(held.discountTotal || 0);
    setPromoCode(held.promoCode || '');
    setNotes(held.notes || '');
    
    // Remove from held
    saveHeldTransactions(heldTransactions.filter(h => h.id !== holdId));
    setShowHeldModal(false);
    toast.success('Transaction resumed');
  };

  const handleRemoveHeld = (holdId: string) => {
    if (confirm('Delete this held transaction?')) {
      saveHeldTransactions(heldTransactions.filter(h => h.id !== holdId));
    }
  };

  const fetchSysSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        // Backend already returns an object dictionary
        setSysSettings(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system settings', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products?status=Available');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchPromos = async () => {
    try {
      const res = await apiClient.get('/promos');
      if (res.data.success) {
        const now = new Date();
        setPromos(res.data.data.filter((p: any) => new Date(p.startDate) <= now && new Date(p.endDate) >= now));
      }
    } catch (error) {}
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const res = await apiClient.post('/inventory/validate-sn', { serial_number: searchInput.trim() });
      if (res.data.success && res.data.data) {
        const product = res.data.data.product;
        handleAddProduct(product);
        setSearchInput('');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Product not found or unavailable';
      setSearchError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProduct = (product: any) => {
    // Check if already in cart
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
      return;
    }
    
    addItem({
      id: product.id,
      name: `${product.brand || ''} ${product.name} ${product.model || ''}`.trim(),
      price: product.sellPrice,
      basePrice: product.sellPrice,
      discount: product.promoPrice ? product.sellPrice - product.promoPrice : 0
    });
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleCheckout = async (overrideToken?: string) => {
    if (items.length === 0) return;
    
    if (!customerName?.trim() || !customerPhone?.trim()) {
      toast.error('Nama dan Nomor Telepon Customer wajib diisi!');
      return;
    }

    if (!leadSource) {
      toast.error('Sumber Leads wajib dipilih!');
      return;
    }

    // Validate custom price
    const invalidItem = items.find(i => i.price < i.basePrice);
    if (invalidItem) {
      toast.error(`Harga ${invalidItem.name} tidak boleh kurang dari harga dasar (${formatRupiah(invalidItem.basePrice)})!`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Timestamp-based unique ID to prevent collision
      const now = new Date();
      const dateStr = now.toISOString().slice(2,10).replace(/-/g,''); // YYMMDD
      const timeMs = now.getTime().toString().slice(-5); // last 5 digits of timestamp
      const transactionId = `b-${user?.branchId || '000'}-${dateStr}-${timeMs}`;
      
      if (isSplitBill) {
        const totalSplit = splitPayments.reduce((acc, curr) => acc + curr.amount, 0);
        if (totalSplit < getTotal()) {
          toast.error('Total split bill kurang dari grand total');
          setIsProcessing(false);
          return;
        }
      }

      // Validate cash payment
      if (!isSplitBill && paymentMethod === 'Cash' && cashReceived !== '' && Number(cashReceived) < getTotal()) {
        toast.error('Uang yang diterima kurang dari total pembayaran');
        setIsProcessing(false);
        return;
      }

      const payload: any = {
        id: transactionId,
        branchId: user?.branchId || 'b-001',
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        subtotal: getSubtotal(),
        discount: items.reduce((acc, item) => acc + item.discount, 0) + discountTotal,
        tax: 0,
        total: getTotal(),
        paymentMethod: isSplitBill ? 'Split Bill' : paymentMethod,
        splitPayments: isSplitBill ? splitPayments.filter(s => s.amount > 0) : undefined,
        promoCampaignId: promoCode || undefined,
        notes: notes || undefined,
        leadSource: leadSource || undefined,
        closingType: closingType || undefined,
        items: items.map(item => ({
          productId: item.id,
          qty: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.price * item.quantity - item.discount
        }))
      };

      if (overrideToken) {
        payload.overrideToken = overrideToken;
      }

      const res = await apiClient.post('/transactions', payload);
      if (res.data.success) {
        setLastTransaction(res.data.data);
        setShowSuccessModal(true);
        toast.success('Payment successful!');
        clearCart(); // CRITICAL: Reset cart after successful transaction
        setCashReceived('');
        fetchProducts();
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    } catch (error: any) {
      console.error(error);
      const requiresApproval = error.response?.data?.requiresApproval;
      if (requiresApproval) {
        setOverrideReason(error.response?.data?.error || 'Transaksi ini membutuhkan otorisasi Manajer.');
        setShowOverrideModal(true);
      } else {
        const errMsg = error.response?.data?.error || 'Checkout failed! Please try again.';
        toast.error(errMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOverriding(true);
    setOverrideError('');
    try {
      const res = await apiClient.post('/auth/override', {
        email: overrideEmail,
        password: overridePassword,
        action: 'APPROVE_TRANSACTION'
      });
      
      if (res.data.success && res.data.overrideToken) {
        toast.success(`Override sukses. Di-otorisasi oleh ${res.data.approverName}`);
        setShowOverrideModal(false);
        setOverrideEmail('');
        setOverridePassword('');
        // Resubmit transaction with token
        await handleCheckout(res.data.overrideToken);
      }
    } catch (error: any) {
      setOverrideError(error.response?.data?.error || 'Kredensial tidak valid atau tidak memiliki akses.');
    } finally {
      setIsOverriding(false);
    }
  };

  const handleValidateVoucher = async () => {
    if (!voucherInput) return;
    setIsValidatingVoucher(true);
    try {
      const res = await apiClient.post('/promos/validate', {
        code: voucherInput,
        subtotal: getSubtotal()
      });
      if (res.data.success) {
        setDiscountTotal(res.data.data.discount);
        setPromoCode(res.data.data.voucherCode);
        toast.success(`Voucher berhasil! Diskon ${formatRupiah(res.data.data.discount)}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Voucher tidak valid');
      setDiscountTotal(0);
      setPromoCode('');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setDiscountTotal(0);
    setPromoCode('');
    setVoucherInput('');
  };

  const handleNewTransaction = () => {
    clearCart();
    setVoucherInput('');
    setShowSuccessModal(false);
    setNotes('');
    setIsSplitBill(false);
    setCashReceived('');
    setSplitPayments([{ method: 'Cash', amount: 0 }, { method: 'Transfer', amount: 0 }]);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.categoryName || p.category?.name).filter(Boolean)))];
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => (p.categoryName || p.category?.name) === selectedCategory);

  return (
    <>
      <div className="h-full bg-slate-50 flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel: Catalog */}
        <div className="flex-[3] flex flex-col bg-glass-bg border border-glass-border rounded-3xl overflow-hidden backdrop-blur-sm">
          
          <div className="p-6 border-b border-glass-border bg-glass-bg flex justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Product Catalog</h2>
            
            {/* Scanner Input inside Catalog header */}
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ScanBarcode className="h-5 w-5 text-muted" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isSearching}
                placeholder="Scan / Ketik ID Produk (Kode-YYMMDD-XXX) / SN..."
                className="w-full pl-12 pr-4 py-3 bg-glass-bg/80 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono shadow-inner disabled:opacity-50 text-sm"
              />
              <button disabled={isSearching} type="submit" className="absolute inset-y-1.5 right-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </form>
          </div>
          
          {searchError && <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">{searchError}</div>}

          {/* Categories */}
          <div className="px-6 py-4 border-b border-glass-border flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 text-muted hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingProducts ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Tag className="w-16 h-16 mb-4 opacity-20" />
                <p>No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                  const inCart = items.some(i => i.id === product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className={`relative bg-glass-bg/50 border border-glass-border rounded-2xl p-4 transition-all cursor-pointer group ${
                        inCart ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'hover:bg-nav-hover hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10'
                      }`}
                    >
                      {inCart && (
                        <div className="absolute top-2 right-12 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">
                          x{items.find(i => i.id === product.id)?.quantity || 1}
                        </div>
                      )}
                      {product.promoPrice && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-0">
                          PROMO
                        </div>
                      )}
                      <div className="w-full aspect-square bg-white/5 rounded-xl mb-4 flex items-center justify-center text-gray-500">
                        {/* Placeholder image */}
                        <ShoppingCart className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="text-xs text-blue-400 font-mono mb-1">{product.id}</div>
                      <h3 className="text-white font-medium text-sm line-clamp-2 mb-2" title={product.name}>
                        {product.brand} {product.name}
                      </h3>
                      <div className="mt-auto">
                        {product.promoPrice ? (
                          <>
                            <div className="text-gray-500 text-xs line-through">{formatRupiah(product.sellPrice)}</div>
                            <div className="text-green-400 font-bold">{formatRupiah(product.promoPrice)}</div>
                          </>
                        ) : (
                          <div className="text-blue-400 font-bold">{formatRupiah(product.sellPrice)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Cart & Checkout Summary */}
        <div className="flex-[2] flex flex-col gap-6 overflow-y-auto pb-6 pr-2 custom-scrollbar relative">
          {/* SESSION LOCK OVERLAY */}
          {!isSessionLoading && !session && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center border border-glass-border">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <Lock className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Kasir Terkunci</h2>
              <p className="text-slate-300 mb-8 max-w-sm">
                Anda dapat melihat stok toko, namun harus membuka shift kasir terlebih dahulu untuk melakukan transaksi.
              </p>
              <button
                onClick={() => setShowOpenSession(true)}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
              >
                <Wallet className="w-5 h-5" />
                Buka Shift Kasir Sekarang
              </button>
            </div>
          )}
          
          {/* Cart Items List */}
          <div className="flex-1 min-h-[300px] flex flex-col bg-glass-bg border border-glass-border rounded-3xl overflow-hidden backdrop-blur-sm shrink-0">
            <div className="p-4 border-b border-glass-border bg-glass-bg flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" /> Current Order
              </h2>
              {items.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-lg">{items.length} items</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <p>Cart is empty</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="flex flex-col p-3 bg-white/5 border border-glass-border rounded-xl group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-8">
                        <h3 className="font-medium text-white text-sm line-clamp-2">{item.name}</h3>
                        <p className="text-xs text-muted font-mono mt-0.5">{item.id}</p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 text-red-400/50 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-auto gap-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="bg-white/10 hover:bg-white/20 text-white rounded w-6 h-6 flex items-center justify-center transition-colors"
                          >-</button>
                          <span className="text-white text-xs w-4 text-center font-mono">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="bg-white/10 hover:bg-white/20 text-white rounded w-6 h-6 flex items-center justify-center transition-colors"
                          >+</button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 w-8">Harga:</span>
                          <input 
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => updateItemPrice(item.id, Number(e.target.value))}
                            onBlur={(e) => {
                              if (Number(e.target.value) < item.basePrice) {
                                toast.error('Harga tidak boleh kurang dari harga dasar!');
                                updateItemPrice(item.id, item.basePrice);
                              }
                            }}
                            placeholder="0"
                            className="w-24 bg-glass-bg border border-glass-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-blue-500 text-right"
                          />
                        </div>

                      </div>
                      <div className="text-right pb-1">
                        {item.discount > 0 && (
                          <div className="text-gray-500 text-[10px] line-through">{formatRupiah(item.price * item.quantity)}</div>
                        )}
                        <div className="text-blue-400 font-medium text-sm">{formatRupiah(item.price * item.quantity - item.discount)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Customer Info */}
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-5 backdrop-blur-sm">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center"><User className="w-4 h-4 mr-2 text-blue-400"/> Customer Details</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
                className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2.5 text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-glass-bg/80 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select 
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-glass-border rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="" disabled>Sumber Leads *</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Tiktok">Tiktok</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Relasi">Relasi</option>
                  <option value="Cold Market">Cold Market</option>
                  <option value="Hot Market">Hot Market</option>
                  <option value="Ads/Iklan">Ads/Iklan</option>
                </select>
                <select 
                  value={closingType}
                  onChange={(e) => setClosingType(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-glass-border rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="Offline">Offline Closing</option>
                  <option value="Online">Online Closing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-5 backdrop-blur-sm shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white text-sm font-medium">Payment Method</h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted">
                <input type="checkbox" checked={isSplitBill} onChange={e => setIsSplitBill(e.target.checked)} className="rounded bg-glass-bg border-gray-600 text-blue-500 focus:ring-blue-500" />
                Split Bill
              </label>
            </div>
            
            {!isSplitBill ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'Cash', icon: Banknote },
                  { id: 'Transfer', icon: CreditCard },
                  { id: 'EDC', icon: Wallet },
                  { id: 'QRIS', icon: Wallet },
                  { id: 'E-commerce', icon: ShoppingCart }
                ].map(method => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                          : 'bg-white/5 border-glass-border text-muted hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">{method.id}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {splitPayments.map((sp, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select 
                      value={sp.method}
                      onChange={(e) => {
                        const newArr = [...splitPayments];
                        newArr[idx].method = e.target.value;
                        setSplitPayments(newArr);
                      }}
                      className="flex-1 bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                      <option value="EDC">EDC (Debit/QRIS)</option>
                      <option value="E-commerce">E-commerce</option>
                    </select>
                    <input 
                      type="number"
                      placeholder="Nominal"
                      value={sp.amount || ''}
                      onChange={(e) => {
                        const newArr = [...splitPayments];
                        newArr[idx].amount = Number(e.target.value);
                        setSplitPayments(newArr);
                      }}
                      className="flex-1 bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher Code */}
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-5 backdrop-blur-sm shrink-0">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center"><Tag className="w-4 h-4 mr-2 text-pink-400"/> Promo & Voucher</h3>
            <div className="flex flex-col gap-3">
              <select
                value={promoCode || ''}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  if (e.target.value) {
                    const p = promos.find(pr => pr.id === e.target.value);
                    if(p) {
                      let totalDisc = p.discountRp || 0;
                      if (p.discountPct > 0) {
                        totalDisc += (getSubtotal() * p.discountPct) / 100;
                      }
                      if (p.maxDiscount && totalDisc > p.maxDiscount) {
                        totalDisc = p.maxDiscount;
                      }
                      setDiscountTotal(totalDisc);
                    }
                  } else {
                    setDiscountTotal(0);
                  }
                }}
                className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">-- Pilih Campaign Promo --</option>
                {promos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - Disc {p.discountRp > 0 ? formatRupiah(p.discountRp) : p.discountPct + '%'}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Catatan Khusus (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2.5 text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            
            {promoCode && (
              <p className="text-green-400 text-xs mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Promo / Voucher aktif!
              </p>
            )}
          </div>

          {/* Cash Change Calculator — only for Cash payment */}
          {!isSplitBill && paymentMethod === 'Cash' && (
            <div className="bg-glass-bg border border-glass-border rounded-3xl p-5 backdrop-blur-sm shrink-0">
              <h3 className="text-white text-sm font-medium mb-3 flex items-center"><Banknote className="w-4 h-4 mr-2 text-green-400"/> Pembayaran Tunai</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-28 shrink-0">Uang Diterima</span>
                  <input
                    type="number"
                    placeholder="Nominal"
                    value={cashReceived === '' ? '' : cashReceived}
                    onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500 text-right"
                  />
                </div>
                {cashReceived !== '' && Number(cashReceived) >= getTotal() && (
                  <div className="flex justify-between items-center bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
                    <span className="text-green-400 text-sm font-medium">Kembalian</span>
                    <span className="text-green-400 font-bold text-lg">{formatRupiah(Number(cashReceived) - getTotal())}</span>
                  </div>
                )}
                {cashReceived !== '' && Number(cashReceived) < getTotal() && (
                  <div className="flex justify-between items-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
                    <span className="text-red-400 text-sm">Kurang</span>
                    <span className="text-red-400 font-bold">{formatRupiah(getTotal() - Number(cashReceived))}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary & Checkout */}
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-5 backdrop-blur-sm">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-muted text-xs">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatRupiah(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-red-400 text-xs">
                <span>Diskon Item</span>
                <span>-{formatRupiah(items.reduce((acc, item) => acc + item.discount, 0))}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-pink-400 text-xs">
                  <span>Voucher Diskon ({promoCode})</span>
                  <span>-{formatRupiah(discountTotal)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-glass-border flex justify-between items-end">
                <span className="text-white text-sm font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {formatRupiah(getTotal())}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleHoldTransaction}
                disabled={items.length === 0 || isProcessing}
                className="flex-1 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 border border-yellow-500/30 rounded-xl font-medium transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <PauseCircle className="w-5 h-5" /> Hold <span className="text-xs opacity-60">(F3)</span>
              </button>
              <button
                onClick={() => handleCheckout()}
                disabled={items.length === 0 || isProcessing}
                className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><span>Pay Now</span> <span className="text-xs opacity-60 font-normal ml-1">(F2)</span></>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden Receipt Printer */}
      <div style={{ display: 'none' }}>
        <ReceiptPrinter 
          ref={receiptRef} 
          transaction={lastTransaction} 
          companyName={sysSettings.STORE_NAME}
          companyAddress={sysSettings.STORE_ADDRESS}
          receiptFooter={sysSettings.RECEIPT_FOOTER}
          logoUrl={sysSettings.STORE_LOGO}
        />
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-muted text-sm mb-6">Transaction recorded successfully.</p>
            <div className="flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-glass-bg border border-glass-border hover:bg-white/5 text-white rounded-xl font-medium transition-colors"
              >
                Cetak Nota
              </button>
              <button 
                onClick={handleNewTransaction}
                className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Held Transactions Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-yellow-500" /> Held Transactions
              </h2>
              <button onClick={() => setShowHeldModal(false)} className="text-gray-400 hover:text-white">
                <Trash2 className="w-5 h-5" style={{display:'none'}} />
                <span>✕</span>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-3">
              {heldTransactions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No held transactions.</p>
                </div>
              ) : (
                heldTransactions.map((held) => (
                  <div key={held.id} className="bg-white/5 border border-glass-border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white mb-1">
                        {held.customerName || 'Walk-in Customer'} <span className="text-muted text-sm ml-2">({held.items.length} items)</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(held.date).toLocaleString('id-ID')} • Total: {formatRupiah(held.total)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleResumeTransaction(held.id)}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <PlayCircle className="w-4 h-4" /> Resume
                      </button>
                      <button 
                        onClick={() => handleRemoveHeld(held.id)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-glass-bg border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <User className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Manager Override Required</h2>
              <p className="text-red-400/80 text-sm">{overrideReason}</p>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              {overrideError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                  {overrideError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Manager Email</label>
                <input
                  type="email"
                  required
                  value={overrideEmail}
                  onChange={(e) => setOverrideEmail(e.target.value)}
                  className="w-full bg-black/40 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="manager@zabran.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={overridePassword}
                  onChange={(e) => setOverridePassword(e.target.value)}
                  className="w-full bg-black/40 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="flex-1 py-3 bg-glass-bg border border-glass-border hover:bg-white/5 text-white rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isOverriding}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/25 flex justify-center items-center"
                >
                  {isOverriding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Otorisasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
