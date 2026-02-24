import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { TrendingUp, ShoppingCart, DollarSign, AlertTriangle, Package } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;
  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ fontSize: '13px', color: p.color, fontFamily: 'DM Mono' }}>{p.name}: {fmt(p.value)}</div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: "Today's Revenue", value: fmt(data.today.revenue), icon: DollarSign, color: 'var(--accent)' },
          { label: "Today's Profit", value: fmt(data.today.profit), icon: TrendingUp, color: 'var(--green)' },
          { label: "Transactions", value: data.today.transactions, icon: ShoppingCart, color: 'var(--purple)' },
          { label: "Low Stock Items", value: data.lowStockProducts?.length || 0, icon: AlertTriangle, color: 'var(--yellow)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
              <div style={{ background: `${s.color}18`, borderRadius: '8px', padding: '8px', color: s.color }}>
                <s.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Weekly chart */}
        <div className="card">
          <div style={{ fontWeight: '600', marginBottom: '20px', fontSize: '14px' }}>Weekly Performance</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weeklySales} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock */}
        <div className="card">
          <div style={{ fontWeight: '600', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--yellow)" />
            Low Stock Alerts
          </div>
          {data.lowStockProducts?.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>All stock levels OK ✓</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.lowStockProducts.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg3)', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.name}</div>
                    {p.barcode && <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'DM Mono' }}>{p.barcode}</div>}
                  </div>
                  <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="card">
        <div style={{ fontWeight: '600', marginBottom: '16px', fontSize: '14px' }}>Top Products Today</div>
        {data.topProducts?.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No sales yet today</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500' }}>{p.name}</td>
                  <td className="mono">{p.quantity}</td>
                  <td className="mono" style={{ color: 'var(--accent)' }}>{fmt(p.revenue)}</td>
                  <td className="mono" style={{ color: 'var(--green)' }}>{fmt(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
