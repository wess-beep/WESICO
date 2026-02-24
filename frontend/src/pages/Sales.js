import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleString();

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [stats, setStats] = useState({ revenue: 0, profit: 0, count: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const { data } = await api.get(`/sales?${params}&limit=100`);
      setSales(data.sales);
      setStats({
        revenue: data.sales.reduce((s, x) => s + x.total, 0),
        profit: data.sales.reduce((s, x) => s + x.totalProfit, 0),
        count: data.total
      });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sales</div>
          <div className="page-sub">Transaction history</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">From Date</label>
            <input type="date" className="input" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} max={today} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">To Date</label>
            <input type="date" className="input" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} max={today} />
          </div>
          <button className="btn btn-primary" onClick={load}>Apply</button>
          <button className="btn btn-ghost" onClick={() => { setFilters({ startDate: today, endDate: today }); setTimeout(load, 100); }}>Today</button>
          <button className="btn btn-ghost" onClick={() => { setFilters({ startDate: '', endDate: '' }); setTimeout(load, 100); }}>All</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total Revenue', value: fmt(stats.revenue), color: 'var(--accent)' },
          { label: 'Total Profit', value: fmt(stats.profit), color: 'var(--green)' },
          { label: 'Transactions', value: stats.count, color: 'var(--purple)' }
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '22px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>
            <BarChart2 size={40} style={{ margin: '0 auto 12px' }} />
            No sales found for selected period
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Receipt</th>
                <th>Date</th>
                <th>Cashier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Profit</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <React.Fragment key={sale._id}>
                  <tr>
                    <td style={{ width: '30px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px' }} onClick={() => setExpanded(expanded === sale._id ? null : sale._id)}>
                        {expanded === sale._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                    <td><span className="mono" style={{ fontSize: '11px', color: 'var(--text2)' }}>{sale.receiptNumber}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{fmtDate(sale.createdAt)}</td>
                    <td style={{ fontSize: '13px' }}>{sale.cashierName}</td>
                    <td style={{ textAlign: 'center' }}>{sale.items.length}</td>
                    <td className="mono" style={{ fontWeight: '600' }}>{fmt(sale.total)}</td>
                    <td className="mono" style={{ color: 'var(--green)' }}>{fmt(sale.totalProfit)}</td>
                    <td><span className="badge badge-blue">{sale.paymentMethod}</span></td>
                  </tr>
                  {expanded === sale._id && (
                    <tr>
                      <td colSpan="8" style={{ background: 'var(--bg3)', padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sale Details</div>
                        <table className="table" style={{ background: 'transparent' }}>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Subtotal</th>
                              <th>Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.items.map((item, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: '500' }}>{item.productName}</td>
                                <td className="mono">{item.quantity}</td>
                                <td className="mono">{fmt(item.unitPrice)}</td>
                                <td className="mono">{fmt(item.subtotal)}</td>
                                <td className="mono" style={{ color: 'var(--green)' }}>{fmt(item.profit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: '10px', display: 'flex', gap: '24px', fontSize: '13px' }}>
                          {sale.discount > 0 && <span style={{ color: 'var(--green)' }}>Discount: {fmt(sale.discount)}</span>}
                          {sale.amountPaid > 0 && <span style={{ color: 'var(--text2)' }}>Paid: {fmt(sale.amountPaid)}</span>}
                          {sale.change > 0 && <span style={{ color: 'var(--text2)' }}>Change: {fmt(sale.change)}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
