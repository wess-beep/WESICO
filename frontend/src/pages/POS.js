import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Scan, Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle, X } from 'lucide-react';
import './POS.css';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export default function POS() {
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const barcodeRef = useRef(null);

  useEffect(() => { barcodeRef.current?.focus(); }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Insufficient stock');
          return prev;
        }
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock === 0) { toast.error('Out of stock'); return prev; }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added`, { duration: 1000 });
  }, []);

  const handleBarcodeSubmit = async (e) => {
    if (e.key !== 'Enter') return;
    const code = barcode.trim();
    if (!code) return;
    try {
      const { data } = await api.get(`/products/barcode/${code}`);
      addToCart(data);
    } catch {
      toast.error('Product not found for barcode: ' + code);
    }
    setBarcode('');
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await api.get(`/products?search=${term}`);
      setSearchResults(data.slice(0, 8));
    } catch {}
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i._id !== id) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.stock) { toast.error('Insufficient stock'); return i; }
      return { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i._id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = parseFloat(discount) || 0;
  const total = subtotal - discountAmt;
  const change = paymentMethod === 'cash' ? (parseFloat(amountPaid) || 0) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (paymentMethod === 'cash' && parseFloat(amountPaid) < total) { toast.error('Insufficient payment'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/sales', {
        items: cart.map(i => ({ productId: i._id, quantity: i.quantity })),
        paymentMethod,
        discount: discountAmt,
        amountPaid: parseFloat(amountPaid) || total,
      });
      setReceipt(data);
      setCart([]);
      setAmountPaid('');
      setDiscount('');
      barcodeRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (receipt) return <ReceiptView receipt={receipt} onNew={() => { setReceipt(null); setTimeout(() => barcodeRef.current?.focus(), 100); }} />;

  return (
    <div className="pos-layout">
      {/* Left: Products/Search */}
      <div className="pos-left">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div className="page-title">Point of Sale</div>
        </div>

        {/* Barcode input */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <label className="label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scan size={13} />Scan Barcode
          </label>
          <input
            ref={barcodeRef}
            type="text"
            className="input"
            placeholder="Scan or type barcode, press Enter..."
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeSubmit}
            style={{ fontFamily: 'DM Mono', fontSize: '15px' }}
          />
        </div>

        {/* Search */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <label className="label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={13} />Search Products
          </label>
          <input
            type="text"
            className="input"
            placeholder="Search by name, SKU..."
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(p => (
                <div key={p._id} className="search-result-item" onClick={() => { addToCart(p); setSearchTerm(''); setSearchResults([]); }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '13px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{p.barcode || p.sku || 'No code'} · Stock: {p.stock}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'DM Mono', color: 'var(--accent)', fontWeight: '600' }}>{fmt(p.price)}</div>
                    <span className={`badge ${p.stock > 10 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>{p.stock} in stock</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="pos-right">
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={16} />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Cart</span>
            {cart.length > 0 && <span className="badge badge-blue">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>}
          </div>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={32} color="var(--text3)" />
              <p>Cart is empty</p>
              <p style={{ fontSize: '12px' }}>Scan a barcode or search for products</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{fmt(item.price)} ea</div>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => updateQty(item._id, -1)}><Minus size={11} /></button>
                  <span className="qty-value mono">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item._id, 1)}><Plus size={11} /></button>
                  <button className="qty-btn remove" onClick={() => removeItem(item._id)}><Trash2 size={11} /></button>
                </div>
                <div className="cart-item-total mono">{fmt(item.price * item.quantity)}</div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          {/* Discount */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Discount ($)</label>
              <input type="number" className="input" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} min="0" />
            </div>
          </div>

          {/* Totals */}
          <div className="totals">
            <div className="total-row"><span>Subtotal</span><span className="mono">{fmt(subtotal)}</span></div>
            {discountAmt > 0 && <div className="total-row discount"><span>Discount</span><span className="mono">- {fmt(discountAmt)}</span></div>}
            <div className="total-row grand"><span>Total</span><span className="mono">{fmt(total)}</span></div>
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: '12px' }}>
            <label className="label">Payment Method</label>
            <div className="payment-methods">
              {[['cash', Banknote, 'Cash'], ['card', CreditCard, 'Card'], ['mobile', Smartphone, 'Mobile']].map(([method, Icon, label]) => (
                <button key={method} className={`payment-method ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Amount Paid</label>
              <input type="number" className="input" placeholder="0.00" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min={total} style={{ fontFamily: 'DM Mono', fontSize: '15px' }} />
              {change > 0 && <div style={{ marginTop: '6px', padding: '6px 10px', background: 'var(--green-dim)', borderRadius: '5px', color: 'var(--green)', fontFamily: 'DM Mono', fontSize: '13px' }}>Change: {fmt(change)}</div>}
            </div>
          )}

          <button className="btn btn-success btn-lg" style={{ width: '100%', justifyContent: 'center', fontSize: '15px' }}
            onClick={handleCheckout} disabled={loading || cart.length === 0}>
            {loading ? 'Processing...' : <>Checkout {cart.length > 0 && fmt(total)}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptView({ receipt, onNew }) {
  const fmt2 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', borderColor: 'var(--green)' }}>
        <CheckCircle size={44} color="var(--green)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Sale Complete!</div>
        <div className="mono" style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '24px' }}>{receipt.receiptNumber}</div>

        <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
          {receipt.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}>
              <span>{item.productName} × {item.quantity}</span>
              <span className="mono">{fmt2(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          {receipt.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--green)', marginBottom: '4px' }}>
            <span>Discount</span><span className="mono">- {fmt2(receipt.discount)}</span>
          </div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px' }}>
            <span>Total</span><span className="mono">{fmt2(receipt.total)}</span>
          </div>
          {receipt.change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            <span>Change</span><span className="mono">{fmt2(receipt.change)}</span>
          </div>}
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }} onClick={onNew}>
          New Sale
        </button>
      </div>
    </div>
  );
}
