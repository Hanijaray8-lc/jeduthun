import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  FiPackage, FiFileText, FiClock, FiSettings, FiMenu, FiX, FiMusic
} from 'react-icons/fi';

const navItems = [
  { to: '/products', icon: FiPackage, label: 'Products' },
  { to: '/invoice', icon: FiFileText, label: 'New Invoice' },
  { to: '/history', icon: FiClock, label: 'Bill History' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-dark-800 border-r border-dark-700 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-700">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-500 bg-white flex items-center justify-center">
  <img
    src="/logo.png"
    alt="Jeduthun Musicals"
    className="w-full h-full object-cover"
  />
</div>
          <div>
            <div className="font-serif text-gold-400 font-bold text-sm leading-tight">Jeduthun</div>
            <div className="text-xs text-dark-400">Musicals</div>
          </div>
          <button
            className="ml-auto lg:hidden text-dark-400 hover:text-gold-400"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gold-500 text-dark-900'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-gold-400'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-dark-700">
          <div className="text-xs text-dark-500">Billing System v1.0</div>
          <div className="text-xs text-dark-600">GSTIN: 33KVOPS8216M1ZM</div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-5 py-4 bg-dark-800 border-b border-dark-700 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gold-400 hover:text-gold-300"
          >
            <FiMenu size={22} />
          </button>
          <span className="font-serif text-gold-400 font-bold">Jeduthun Musicals</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
