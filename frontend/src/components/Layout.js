import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutGrid, ShoppingCart, Package, BarChart2, Users, LogOut, Store } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    ...(hasRole('admin', 'manager') ? [{ to: '/', icon: LayoutGrid, label: 'Dashboard', exact: true }] : []),
    { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    ...(hasRole('admin', 'manager') ? [{ to: '/products', icon: Package, label: 'Products' }] : []),
    ...(hasRole('admin', 'manager') ? [{ to: '/sales', icon: BarChart2, label: 'Sales' }] : []),
    ...(hasRole('admin') ? [{ to: '/users', icon: Users, label: 'Users' }] : []),
  ];

  const roleColors = { admin: '#8b5cf6', manager: '#3b82f6', cashier: '#10b981' };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><Store size={18} /></div>
          <div>
            <div className="brand-name">SwiftPOS</div>
            <div className="brand-tagline">Point of Sale</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" style={{ background: roleColors[user?.role] }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
