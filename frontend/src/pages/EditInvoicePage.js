import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../utils/api';
import InvoicePage from './InvoicePage';
import toast from 'react-hot-toast';

export default function EditInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoiceAPI.getOne(id)
      .then(res => setInvoiceData(res.data.data))
      .catch(() => {
        toast.error('Invoice not found');
        navigate('/history');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gold-400 animate-pulse font-serif text-lg">Loading invoice...</div>
      </div>
    );
  }

  return <InvoicePage prefillData={invoiceData} editId={id} />;
}
