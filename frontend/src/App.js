import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProductsPage from './pages/ProductsPage';
import InvoicePage from './pages/InvoicePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import EditInvoicePage from './pages/EditInvoicePage';
import AdminLoginPage from './pages/adminlogin';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#D4AF37',
            border: '1px solid #B8860B',
            fontFamily: 'Nunito, sans-serif',
          },
          success: { iconTheme: { primary: '#D4AF37', secondary: '#1a1a1a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a1a' } },
        }}
      />
      <Routes>

  {/* Login Page */}
  <Route path="/admin" element={<AdminLoginPage />} />

  {/* Layout Pages */}
  <Route path="/" element={<Layout />}>
    
    {/* Landing Page */}
    <Route index element={<Navigate to="/admin" replace />} />

    <Route path="products" element={<ProductsPage />} />
    <Route path="invoice" element={<InvoicePage />} />
    <Route path="invoice/edit/:id" element={<EditInvoicePage />} />
    <Route path="history" element={<HistoryPage />} />
    <Route path="settings" element={<SettingsPage />} />

  </Route>

</Routes>
    </Router>
  );
}

export default App;
