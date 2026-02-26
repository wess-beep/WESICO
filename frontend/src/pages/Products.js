import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product object
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const load = async (q = '') => {
    try {
      const { data } = await api.get(`/products${q ? `?search=${q}` : ''}`);
      setProducts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      load(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-sub">{products.length} items in inventory</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal('add')}>
            <Plus size={14} /> Add Product
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input type="text" className="input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px' }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>
            <Package size={40} style={{ margin: '0 auto 12px' }} />
            <div>No products found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Profit</th>
                <th>Stock</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const profit = p.price - p.costPrice;
                const margin = p.price > 0 ? ((profit / p.price) * 100).toFixed(1) : 0;
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{p.sku}</div>}
                    </td>
                    <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text2)' }}>{p.barcode || '—'}</span></td>
                    <td><span className="badge badge-blue">{p.category}</span></td>
                    <td className="mono" style={{ color: 'var(--text2)' }}>{fmt(p.costPrice)}</td>
                    <td className="mono" style={{ fontWeight: '600' }}>{fmt(p.price)}</td>
                    <td>
                      <div className="mono" style={{ color: 'var(--green)' }}>{fmt(profit)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{margin}%</div>
                    </td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= p.lowStockAlert ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(p)}><Edit2 size={12} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => handleDelete(p._id, p.name)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ProductModal product={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(search); }} />}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    barcode: product?.barcode || '',
    sku: product?.sku || '',
    category: product?.category || 'General',
    price: product?.price || '',
    costPrice: product?.costPrice || '',
    stock: product?.stock || 0,
    lowStockAlert: product?.lowStockAlert || 10,
    unit: product?.unit || 'pcs',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await api.put(`/products/${product._id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const profit = (parseFloat(form.price) - parseFloat(form.costPrice)) || 0;
  const margin = parseFloat(form.price) > 0 ? ((profit / parseFloat(form.price)) * 100).toFixed(1) : 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="modal-title" style={{ margin: 0 }}>{product ? 'Edit Product' : 'Add Product'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><XIcon size={14} /></button>
        </div>

        {profit > 0 && (
          <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: '6px', padding: '8px 12px', marginBottom: '16px', display: 'flex', gap: '16px', fontSize: '13px' }}>
            <span style={{ color: 'var(--green)' }}>Profit: ${profit.toFixed(2)}</span>
            <span style={{ color: 'var(--green)' }}>Margin: {margin}%</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Barcode</label>
              <input className="input mono" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="e.g. 8901234567890" />
            </div>
            <div className="form-group">
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={e => set('sku', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={e => set('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'pair'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Cost Price ($) *</label>
              <input className="input" type="number" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Selling Price ($) *</label>
              <input className="input" type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Stock Qty</label>
              <input className="input" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label className="label">Low Stock Alert</label>
              <input className="input" type="number" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} min="0" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
