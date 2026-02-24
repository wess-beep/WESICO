import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, X } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const { user: me } = useAuth();

  const load = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const roleColors = { admin: 'badge-purple', manager: 'badge-blue', cashier: 'badge-green' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Users</div>
          <div className="page-sub">{users.length} total accounts</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: u.role === 'admin' ? '#8b5cf6' : u.role === 'manager' ? '#3b82f6' : '#10b981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0
                      }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '500' }}>{u.name} {u._id === me._id && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>(you)</span>}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}><Edit2 size={12} /></button>
                      {u._id !== me._id && (
                        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => handleDelete(u._id, u.name)}><Trash2 size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <UserModal user={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'cashier',
    active: user?.active !== undefined ? user.active : true,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (user) {
        await api.put(`/users/${user._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', payload);
        toast.success('User created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="modal-title" style={{ margin: 0 }}>{user ? 'Edit User' : 'Add User'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group full">
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group full">
              <label className="label">{user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} required={!user} minLength={6} />
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.active} onChange={e => set('active', e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg3)', borderRadius: '6px', fontSize: '12px', color: 'var(--text2)' }}>
            <strong>Roles:</strong> Admin = full access · Manager = view sales &amp; products · Cashier = POS only
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
