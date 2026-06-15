import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import {
  FiSearch, FiEye, FiEdit2, FiTrash2, FiPrinter,
  FiShare2, FiDownload, FiX, FiFileText
} from 'react-icons/fi';
import { invoiceAPI, pdfAPI } from '../utils/api';
import { formatDate, formatCurrency, printHTML, getWhatsAppUrl, downloadBlob, openWindowImmediately, navigateWindow } from '../utils/helpers';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterDate) params.date = filterDate;
      else if (filterMonth && filterYear) {
        params.month = filterMonth;
        params.year = filterYear;
      }
      const res = await invoiceAPI.getAll(params);
      setInvoices(res.data.data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [search, filterMonth, filterYear, filterDate]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(t);
  }, [fetchInvoices]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Print via print dialog (HTML)
  const handlePrint = async (invoice, type = 'invoice') => {
    const toastId = toast.loading('Preparing print...');
    try {
      const res = await pdfAPI.generate(invoice._id, type);
      printHTML(res.data.html);
      toast.dismiss(toastId);
    } catch {
      toast.error('Failed to generate', { id: toastId });
    }
  };
  // KEY FIX: open window synchronously BEFORE await — browsers block window.open after async
  const handleShareWA = async (invoice, type = 'invoice') => {

  const waWin = openWindowImmediately();

  const toastId = toast.loading('Generating PDF...');

  try {

    const res = await pdfAPI.downloadPDF(
      invoice._id,
      type
    );

    const pdfLink = res.data.pdfUrl;

    const label =
      type === 'quotation'
        ? 'Quotation'
        : 'Invoice';

    const msg =
`Dear ${invoice.customer.name},

Your ${label} #${invoice.invoiceNo}

Download PDF:
${pdfLink}

Thank you!
Jeduthun Musicals
📞 04637-213875
📱 +91 8838858275`;

    navigateWindow(
      waWin,
      getWhatsAppUrl(invoice.customer.phone, msg)
    );

    toast.success(
      'WhatsApp opened!',
      { id: toastId }
    );

  } catch (err) {

    if (waWin) waWin.close();

    toast.error(
      'Failed to generate PDF',
      { id: toastId }
    );
  }
};
  // Direct PDF download to device
const handleDownloadQuotation = async (invoice) => {

  const toastId =
    toast.loading('Downloading quotation...');

  try {

    const res = await pdfAPI.generate(
      invoice._id,
      'quotation'
    );

    const html = res.data.html;
    const fileName = `Quotation-${invoice.invoiceNo}.pdf`;

    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    
    document.body.removeChild(element);

    toast.success(
      'Quotation downloaded!',
      { id: toastId }
    );

  } catch (err) {

    console.error('Download error:', err);
    toast.error(
      'Failed to download quotation',
      { id: toastId }
    );
  }
};
  const clearFilters = () => {
    setSearch(''); setFilterMonth(''); setFilterYear(''); setFilterDate('');
  };

  const hasFilters = search || filterMonth || filterYear || filterDate;
  const totalAmount = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Bill History</h1>
          <p className="text-dark-400 text-sm mt-1">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} • Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <button onClick={() => navigate('/invoice')} className="gold-btn">
          <FiFileText size={15} /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={14} />
            <input
              className="input-field pl-9"
              placeholder="Search by name, phone, invoice#..."
              value={search}
              onChange={e => { setSearch(e.target.value); setFilterDate(''); setFilterMonth(''); setFilterYear(''); }}
            />
          </div>
          <div>
            <select
              className="input-field"
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <select
              className="input-field"
              value={filterYear}
              onChange={e => { setFilterYear(e.target.value); setFilterDate(''); }}
            >
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <input
              type="date"
              className="input-field"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); setFilterYear(''); setSearch(''); }}
            />
          </div>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="mt-3 text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1">
            <FiX size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Action legend */}
      <div className="flex flex-wrap gap-3 text-xs text-dark-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> View</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold-500 inline-block"></span> Edit</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Delete</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Invoice #</th>
                <th className="table-th">Date</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Phone</th>
                <th className="table-th text-right pr-4">Amount</th>
                <th className="table-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-dark-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <FiFileText className="mx-auto text-dark-600 mb-3" size={40} />
                    <p className="text-dark-400">No invoices found</p>
                  </td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="table-row">
                  <td className="table-td font-mono text-gold-500 font-semibold">{inv.invoiceNo}</td>
                  <td className="table-td text-dark-400 whitespace-nowrap">{formatDate(inv.date)}</td>
                  <td className="table-td font-medium">{inv.customer?.name}</td>
                  <td className="table-td text-dark-400">{inv.customer?.phone}</td>
                  <td className="table-td text-right font-mono font-semibold text-gold-400 pr-4">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {/* View */}
                      <button onClick={() => setViewInvoice(inv)} title="View details"
                        className="p-1.5 rounded-lg bg-dark-700 text-blue-400 hover:bg-blue-900 transition-colors">
                        <FiEye size={13} />
                      </button>
                      {/* Edit */}
                      <button onClick={() => navigate(`/invoice/edit/${inv._id}`)} title="Edit invoice"
                        className="p-1.5 rounded-lg bg-dark-700 text-gold-500 hover:bg-gold-600 hover:text-dark-900 transition-colors">
                        <FiEdit2 size={13} />
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(inv._id)} title="Delete invoice"
                        className="p-1.5 rounded-lg bg-dark-700 text-red-500 hover:bg-red-900 transition-colors">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <div>
                <h2 className="font-serif text-gold-400 text-xl font-bold">{viewInvoice.invoiceNo}</h2>
                <p className="text-dark-400 text-sm">{formatDate(viewInvoice.date)}</p>
              </div>
              <button onClick={() => setViewInvoice(null)} className="text-dark-400 hover:text-gold-400">
                <FiX size={22} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gold-600 uppercase tracking-wide mb-1">Customer</div>
                  <div className="font-semibold">{viewInvoice.customer?.name}</div>
                  <div className="text-dark-400 text-sm">{viewInvoice.customer?.phone}</div>
                  {viewInvoice.customer?.address && (
                    <div className="text-dark-500 text-xs mt-0.5">{viewInvoice.customer.address}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gold-600 uppercase tracking-wide mb-1">Total</div>
                  <div className="font-mono text-2xl text-gold-400 font-bold">
                    {formatCurrency(viewInvoice.totalAmount)}
                  </div>
                  <div className="text-dark-500 text-xs">incl. {viewInvoice.gstRate}% GST</div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-2 text-gold-600 text-xs uppercase">Item</th>
                    <th className="text-center py-2 text-gold-600 text-xs uppercase">Qty</th>
                    <th className="text-right py-2 text-gold-600 text-xs uppercase">Rate</th>
                    <th className="text-right py-2 text-gold-600 text-xs uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items?.map((item, i) => (
                    <tr key={i} className="border-b border-dark-700">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-center">{item.quantity} {item.unit || 'pcs'}</td>
                      <td className="py-2 text-right font-mono">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right font-mono text-gold-400">₹{Number(item.total).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-dark-900 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-dark-400">Subtotal</span>
                  <span>₹{viewInvoice.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">CGST ({(viewInvoice.gstRate / 2)}%)</span>
                  <span>₹{(viewInvoice.gstAmount / 2)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">SGST ({(viewInvoice.gstRate / 2)}%)</span>
                  <span>₹{(viewInvoice.gstAmount / 2)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gold-400 text-base border-t border-dark-700 pt-1 mt-1">
                  <span>Total</span><span>{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">

  {/* Print Bill */}
  <button
    onClick={() => handlePrint(viewInvoice, 'invoice')}
    className="dark-btn justify-center"
  >
    <FiPrinter size={14} /> Print Bill
  </button>

  {/* Print Quotation */}
  <button
    onClick={() => handlePrint(viewInvoice, 'quotation')}
    className="dark-btn justify-center"
  >
    <FiPrinter size={14} /> Print Quote
  </button>

  {/* Share Bill */}
  <button
    onClick={() => handleShareWA(viewInvoice, 'invoice')}
    className="gold-btn justify-center"
  >
    <FiShare2 size={14} /> Share Bill
  </button>

  {/* Share Quotation */}
  <button
    onClick={() => handleShareWA(viewInvoice, 'quotation')}
    className="dark-btn justify-center"
  >
    <FiShare2 size={14} /> Share Quote
  </button>

  {/* Download Quotation */}
  <button
    onClick={() => handleDownloadQuotation(viewInvoice)}
    className="dark-btn justify-center col-span-2"
  >
    <FiDownload size={14} /> Download Quote
  </button>

</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}