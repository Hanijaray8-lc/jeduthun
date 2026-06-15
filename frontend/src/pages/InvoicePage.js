import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import {
  FiPlus, FiTrash2, FiSearch, FiPrinter, FiShare2, FiSave,
  FiUser, FiPhone, FiMapPin, FiHash, FiCalendar, FiDownload,
  FiCheckCircle, FiX
} from 'react-icons/fi';
import { productAPI, invoiceAPI, shopAPI, pdfAPI } from '../utils/api';
import {
  numberToWords, printHTML, getWhatsAppUrl,
  downloadBlob, openWindowImmediately, navigateWindow
} from '../utils/helpers';

const emptyItem = { productId: null, name: '', quantity: 1, mrpRate: '', rate: '', total: 0 };
const GST_RATE = 18;

// ─── Post-save modal ──────────────────────────────────────────────────────────
function SavedModal({ invoice, shopData, onClose }) {
  const [loadingBill, setLoadingBill]       = useState(false);
  const [loadingQuote, setLoadingQuote]     = useState(false);
  const [loadingDlQuote, setLoadingDlQuote] = useState(false);
  const [loadingPrintBill, setLoadingPrintBill]   = useState(false);
  const [loadingPrintQuote, setLoadingPrintQuote] = useState(false);

  const buildItemizedMsg = (type, items) => {
    return `Dear ${invoice.customer.name},

Your ${type === 'quotation' ? 'Quotation' : 'Invoice'} #${invoice.invoiceNo}

Thank you!
Jeduthun Musicals
📞 ${shopData?.phone1 || '04637-213875'}
📱 ${shopData?.phone2 || '+91 8838858275'}`;
  };

  // KEY FIX: open window synchronously BEFORE any await
 const shareBill = async () => {

  const waWin = openWindowImmediately();

  setLoadingBill(true);

  try {

    const res = await pdfAPI.downloadPDF(
      invoice._id,
      'invoice'
    );

    const pdfLink = res.data.pdfUrl;

    const itemizedMsg = buildItemizedMsg('invoice', invoice.items);

    const whatsappUrl = getWhatsAppUrl(
      invoice.customer.phone,

`${itemizedMsg}

Download PDF: ${pdfLink}`
    );

    navigateWindow(waWin, whatsappUrl);

    toast.success('WhatsApp opened!');

  } catch (err) {

    if (waWin) waWin.close();

    toast.error('Failed to share invoice');

  } finally {

    setLoadingBill(false);
  }
};
 const shareQuotation = async () => {

  const waWin = openWindowImmediately();

  setLoadingQuote(true);

  try {

    const res = await pdfAPI.downloadPDF(
      invoice._id,
      'quotation'
    );

    const pdfLink = res.data.pdfUrl;

    const itemizedMsg = buildItemizedMsg('quotation', invoice.items);

    const whatsappUrl = getWhatsAppUrl(
      invoice.customer.phone,

`${itemizedMsg}

Download PDF: ${pdfLink}`
    );

    navigateWindow(waWin, whatsappUrl);

    toast.success('WhatsApp opened!');

  } catch (err) {

    if (waWin) waWin.close();

    toast.error('Failed to share quotation');

  } finally {

    setLoadingQuote(false);
  }
};
  const downloadQuotation = async () => {

  setLoadingDlQuote(true);

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

    toast.success('Quotation PDF downloaded!');

  } catch (err) {

    console.error('❌ Download error:', err);
    toast.error('Failed to download quotation');

  } finally {

    setLoadingDlQuote(false);
  }
};

  const printBill = async () => {
    setLoadingPrintBill(true);
    try {
      const res = await pdfAPI.generate(invoice._id, 'invoice');
      printHTML(res.data.html);
    } catch {
      toast.error('Failed to print bill');
    } finally {
      setLoadingPrintBill(false);
    }
  };

  const printQuotation = async () => {
    setLoadingPrintQuote(true);
    try {
      const res = await pdfAPI.generate(invoice._id, 'quotation');
      printHTML(res.data.html);
    } catch {
      toast.error('Failed to print quotation');
    } finally {
      setLoadingPrintQuote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-dark-800 border border-gold-700 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-gold-400" size={22} />
            <span className="font-serif text-gold-400 text-lg font-bold">Invoice Saved!</span>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-gold-400 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Invoice summary */}
        <div className="px-6 py-4 bg-dark-900 mx-4 mt-4 rounded-xl border border-dark-700">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Invoice #</span>
            <span className="font-mono text-gold-400 font-bold">{invoice.invoiceNo}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-dark-400">Customer</span>
            <span className="text-dark-200 font-medium">{invoice.customer.name}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-dark-400">Phone</span>
            <span className="text-dark-200">{invoice.customer.phone}</span>
          </div>
          <div className="flex justify-between text-base mt-2 pt-2 border-t border-dark-700 font-bold">
            <span className="text-gold-500">Total</span>
            <span className="text-gold-400 font-mono">₹{invoice.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 space-y-2.5">
          <p className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-3">Choose action</p>

          {/* Print Bill */}
          <button onClick={printBill} disabled={loadingPrintBill}
            className="w-full flex items-center gap-3 px-4 py-3 bg-dark-700 border border-dark-600 text-dark-200 rounded-xl hover:bg-dark-600 transition-all disabled:opacity-50">
            <FiPrinter className="text-white" size={18} />
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Print Bill</div>
              <div className="text-xs text-dark-400">Opens print dialog (A4)</div>
            </div>
            {loadingPrintBill && <span className="text-xs text-dark-400 animate-pulse">Loading...</span>}
          </button>

          {/* Print Quotation */}
          <button onClick={printQuotation} disabled={loadingPrintQuote}
            className="w-full flex items-center gap-3 px-4 py-3 bg-dark-700 border border-dark-600 text-dark-200 rounded-xl hover:bg-dark-600 transition-all disabled:opacity-50">
            <FiPrinter className="text-yellow-400" size={18} />
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Print Quotation</div>
              <div className="text-xs text-dark-400">Opens print dialog (A4)</div>
            </div>
            {loadingPrintQuote && <span className="text-xs text-dark-400 animate-pulse">Loading...</span>}
          </button>

          {/* Share Bill on WhatsApp */}
          <button onClick={shareBill} disabled={loadingBill}
            className="w-full flex items-center gap-3 px-4 py-3 bg-green-900 border border-green-700 text-green-300 rounded-xl hover:bg-green-800 transition-all disabled:opacity-50">
            <span className="text-xl leading-none">📤</span>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Share Bill on WhatsApp</div>
              <div className="text-xs text-green-500">Downloads PDF + opens WhatsApp with customer</div>
            </div>
            {loadingBill && <span className="text-xs animate-pulse">Generating...</span>}
          </button>

          {/* Share Quotation on WhatsApp */}
          <button onClick={shareQuotation} disabled={loadingQuote}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-900 border border-blue-700 text-blue-300 rounded-xl hover:bg-blue-800 transition-all disabled:opacity-50">
            <span className="text-xl leading-none">📋</span>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Share Quotation on WhatsApp</div>
              <div className="text-xs text-blue-400">Downloads PDF + opens WhatsApp with customer</div>
            </div>
            {loadingQuote && <span className="text-xs animate-pulse">Generating...</span>}
          </button>

          {/* Download Quotation */}
          <button onClick={downloadQuotation} disabled={loadingDlQuote}
            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-900 border border-purple-700 text-purple-300 rounded-xl hover:bg-purple-800 transition-all disabled:opacity-50">
            <FiDownload size={18} />
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Download Quotation PDF</div>
              <div className="text-xs text-purple-400">Saves directly to your device</div>
            </div>
            {loadingDlQuote && <span className="text-xs animate-pulse">Downloading...</span>}
          </button>

          <button onClick={onClose}
            className="w-full py-2.5 text-sm text-dark-400 hover:text-gold-400 transition-colors border-t border-dark-700 mt-1 pt-3">
            Done — Go to History →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Invoice Page ────────────────────────────────────────────────────────
export default function InvoicePage({ prefillData = null, editId = null }) {
  const navigate = useNavigate();
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(
  new Date().toLocaleString('sv-SE', {
    timeZone: 'Asia/Kolkata'
  }).replace(' ', 'T')
);
  const [customer, setCustomer]   = useState({ name: '', phone: '', address: '' });
  const [items, setItems]         = useState([{ ...emptyItem }]);
  const [saving, setSaving]       = useState(false);
  const [shopData, setShopData]   = useState(null);
  const [savedInvoice, setSavedInvoice] = useState(null);

  const [searchOpen, setSearchOpen]     = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!editId) {
      invoiceAPI.getNextNumber().then(r => setInvoiceNo(r.data.nextNo)).catch(() => setInvoiceNo('INV-001'));
    }
    shopAPI.get().then(r => setShopData(r.data.data)).catch(() => {});
  }, [editId]);

  useEffect(() => {
    if (prefillData) {
      setInvoiceNo(prefillData.invoiceNo || '');
    setDate(
  prefillData.date ||
  new Date().toLocaleString('sv-SE').replace(' ', 'T')
);
      setCustomer(prefillData.customer || { name: '', phone: '', address: '' });
      setItems(prefillData.items?.length ? prefillData.items : [{ ...emptyItem }]);
    }
  }, [prefillData]);

  useEffect(() => {
    if (searchOpen === null) return;
    if (!searchQuery) {
      productAPI.getAll('').then(r => setSearchResults(r.data.data.slice(0, 8))).catch(() => setSearchResults([]));
    } else {
      const t = setTimeout(() => {
        productAPI.getAll(searchQuery).then(r => setSearchResults(r.data.data)).catch(() => setSearchResults([]));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [searchQuery, searchOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(null); setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectProduct = (idx, product) => {
    const newItems = [...items];
    const mrp = product.amount || 0;
    
    console.log(`🎯 Product Selected - Item ${idx}:`, {
      productName: product.name,
      productAmount: product.amount,
      mrp: mrp
    });
    
    if (!mrp || mrp <= 0) {
      toast.error('⚠️ Product MRP rate is invalid or not set. Please enter MRP manually.');
      return;
    }
    
    const calculatedRate = mrp / 1.18; // Rate = MRP / 1.18
    newItems[idx] = {
      productId: product._id,
      name: product.name,
      quantity: newItems[idx].quantity || 1,
      mrpRate: mrp,
      rate: calculatedRate,
      total: (newItems[idx].quantity || 1) * calculatedRate
    };
    
    console.log(`✅ Item ${idx} Updated:`, newItems[idx]);
    
    setItems(newItems);
    setSearchOpen(null); 
    setSearchQuery('');
    toast.success(`${product.name} added! MRP: ₹${mrp.toFixed(2)}`);
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    
    if (field === 'mrpRate') {
      const mrp = Number(value);
      newItems[idx].rate = mrp / 1.18; // Rate = MRP / 1.18
      console.log(`🔄 MRP Updated - Item ${idx}:`, {
        mrpInput: value,
        mrpNumber: mrp,
        calculatedRate: mrp / 1.18,
        state: newItems[idx]
      });
    }
    
    if (field === 'quantity' || field === 'rate' || field === 'mrpRate') {
      const qty = Number(newItems[idx].quantity);
      const rate = Number(newItems[idx].rate);
      newItems[idx].total = qty * rate;
    }
    
    setItems(newItems);
  };

  const addItem    = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (idx) => {
    if (items.length === 1) return toast.error('At least one item required');
    setItems(items.filter((_, i) => i !== idx));
  };

 const subtotal = items.reduce(
  (s, i) => s + (Number(i.total) || 0),
  0
);

const gstAmount = (subtotal * GST_RATE) / 100;

// split GST
const cgstRate = GST_RATE / 2;
const sgstRate = GST_RATE / 2;

const cgstAmount = gstAmount / 2;
const sgstAmount = gstAmount / 2;

const totalAmount = subtotal + gstAmount;
  const buildPayload = () => {
    const payload = {
      invoiceNo,
      date,
      customer,
      items: items.map((i, idx) => {
        const item = {
          productId: i.productId || null,
          name: i.name,
          quantity: Number(i.quantity),
          amount: Number(i.rate),
          mrpRate: Number(i.mrpRate),
          rate: Number(i.rate),
          total: Number(i.total)
        };
        
        console.log(`📦 Item ${idx}:`, {
          name: i.name,
          mrpRateInput: i.mrpRate,
          mrpRateNumber: Number(i.mrpRate),
          rateInput: i.rate,
          rateNumber: Number(i.rate),
          payload: item
        });
        
        return item;
      }),
      subtotal,
      gstRate: GST_RATE,
      gstAmount,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      totalAmount,
      totalInWords: numberToWords(totalAmount),
      type: 'invoice'
    };
    
    console.log('📤 FINAL PAYLOAD:', JSON.stringify(payload.items[0], null, 2));
    return payload;
  };

  const validate = () => {
    if (!invoiceNo)                                       return 'Invoice number required';
    if (!customer.name)                                  return 'Customer name required';
    if (!customer.phone)                                 return 'Customer phone required';
    if (items.some(i => !i.name || !i.rate))          return 'All items need name and rate';
    if (items.some(i => !i.mrpRate || Number(i.mrpRate) <= 0))  return 'All items need valid MRP Rate (must be > 0)';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const payload = buildPayload();
      console.log('📤 Sending payload:', JSON.stringify(payload.items[0], null, 2));
      
      let saved;
      if (editId) {
        const res = await invoiceAPI.update(editId, payload);
        saved = res.data.data;
        toast.success('Invoice updated!');
      } else {
        const res = await invoiceAPI.create(payload);
        saved = res.data.data;
        console.log('📥 Received from backend:', JSON.stringify(saved.items[0], null, 2));
        toast.success('Invoice saved!');
      }
      setSavedInvoice(saved);
    } catch (err) {
      const message = err.response?.data?.message || 'Error saving invoice';
      console.error('❌ Save error:', message);
      toast.error(message);
      
      // If it's a duplicate invoice number error, refresh the next number
      if (message.includes('E11000') || message.includes('duplicate')) {
        invoiceAPI.getNextNumber()
          .then(r => {
            setInvoiceNo(r.data.nextNo);
            toast.info(`Invoice number updated to ${r.data.nextNo}`);
          })
          .catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {savedInvoice && (
        <SavedModal
          invoice={savedInvoice}
          shopData={shopData}
          onClose={() => { setSavedInvoice(null); navigate('/history'); }}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">{editId ? 'Edit Invoice' : 'New Invoice'}</h1>
            <p className="text-dark-400 text-sm mt-1">Save invoice to get print, share & download options</p>
          </div>
          <button onClick={handleSave} className="gold-btn" disabled={saving}>
            <FiSave size={15} /> {saving ? 'Saving...' : (editId ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>

        {/* Invoice Meta */}
        <div className="card">
          <h2 className="font-serif text-gold-400 font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label"><FiHash className="inline mr-1" size={11} />Invoice No</label>
              <input className="input-field font-mono" value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-001" />
            </div>
            <div>
              <label className="label"><FiCalendar className="inline mr-1" size={11} />Date</label>
             <input
  type="date"
  className="input-field"
  value={date ? date.split('T')[0] : ''}
  onChange={(e) => {

    const selectedDate = e.target.value;

    const now = new Date();

    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    setDate(`${selectedDate}T${hh}:${mi}:${ss}`);
  }}
/>
            </div>
            <div>
              <label className="label"><FiUser className="inline mr-1" size={11} />Customer Name *</label>
              <input className="input-field" placeholder="Customer name" value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })} />
            </div>
            <div>
              <label className="label"><FiPhone className="inline mr-1" size={11} />Phone No *</label>
              <input className="input-field" placeholder="+91 XXXXX XXXXX" value={customer.phone}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="label"><FiMapPin className="inline mr-1" size={11} />Address</label>
              <input className="input-field" placeholder="Customer address (optional)" value={customer.address}
                onChange={e => setCustomer({ ...customer, address: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-gold-400 font-semibold">Items</h2>
            <button onClick={addItem} className="gold-btn text-xs px-3 py-1.5">
              <FiPlus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gold-600 uppercase tracking-wider pb-2 border-b border-dark-700">
              <div className="col-span-4">Product / Description</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2 text-right">MRP Rate (₹) *</div>
              <div className="col-span-2 text-right">Rate (₹)</div>
              <div className="col-span-2 text-right">Total (₹)</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center mb-4 pb-3 border-b border-dark-700 last:border-0">
                {/* Product name + search */}
                <div className="col-span-12 md:col-span-4 relative" ref={searchOpen === idx ? searchRef : null}>
                  <div className="flex gap-1">
                    <input
                      className="input-field flex-1"
                      placeholder="Product name or type manually..."
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      onFocus={() => { setSearchOpen(idx); setSearchQuery(''); }}
                    />
                    <button type="button"
                      onClick={() => { setSearchOpen(searchOpen === idx ? null : idx); setSearchQuery(''); }}
                      className="px-2.5 bg-dark-700 border border-dark-600 rounded-lg text-gold-500 hover:bg-dark-600 transition-colors"
                      title="Search stored products">
                      <FiSearch size={14} />
                    </button>
                  </div>

                  {searchOpen === idx && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-2 border-b border-dark-700">
                        <input autoFocus className="input-field text-xs" placeholder="Search stored products..."
                          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-dark-400 text-xs text-center">No products found — type manually</div>
                        ) : searchResults.map(p => (
                          <button key={p._id} type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-0"
                            onClick={() => selectProduct(idx, p)}>
                            <div className="text-sm text-dark-100 font-medium">{p.name}</div>
                            <div className="text-xs text-gold-500 mt-0.5">₹{Number(p.amount).toLocaleString('en-IN')} / {p.unit}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Qty */}
                <div className="col-span-4 sm:col-span-3 md:col-span-1">
                  <label className="text-xs text-dark-400 md:hidden">Qty</label>
                  <input className="input-field text-center" type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                </div>

                {/* MRP Rate */}
                <div className="col-span-4 sm:col-span-4 md:col-span-2">
                  <label className="text-xs text-dark-400 md:hidden">MRP</label>
                  <input 
                    className="input-field text-right font-semibold border-blue-500 bg-blue-900 bg-opacity-20" 
                    type="number" 
                    placeholder="MRP *" 
                    value={item.mrpRate}
                    onChange={e => updateItem(idx, 'mrpRate', e.target.value)}
                    required
                  />
                </div>

                {/* Rate */}
                <div className="col-span-4 sm:col-span-4 md:col-span-2">
                  <label className="text-xs text-dark-400 md:hidden">Rate</label>
                  <div className="input-field text-right font-semibold text-gold-400 cursor-default select-none">
                    ₹{(Number(item.rate) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-7 sm:col-span-6 md:col-span-2">
                  <label className="text-xs text-dark-400 md:hidden">Total</label>
                  <div className="input-field text-right font-semibold text-gold-400 cursor-default select-none">
                    ₹{(Number(item.total) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Remove */}
                <div className="col-span-5 sm:col-span-2 md:col-span-1 flex justify-end">
                  <button onClick={() => removeItem(idx)}
                    className="p-2 rounded-lg bg-dark-700 text-red-500 hover:bg-red-900 transition-colors w-full md:w-auto">
                    <FiTrash2 size={14} className="mx-auto md:mx-0" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-dark-700">
            {/* <div className="mb-3 p-3 bg-yellow-900 bg-opacity-40 border border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-300"><strong>⚠️ Required Fields:</strong> MRP Rate must be filled for all items. Select products from dropdown to auto-fill, or enter manually.</p>
            </div>
            <div className="mb-3 p-2.5 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-300">💡 <strong>Tip:</strong> Select products from dropdown to auto-fill MRP Rate, or enter manually. MRP Rate is required for invoice/quotation display.</p>
            </div> */}
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Subtotal</span>
                <span className="font-mono text-dark-200">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
             <div className="flex justify-between text-sm">
  <span className="text-dark-500">
    CGST ({cgstRate}%)
  </span>

  <span className="font-mono text-dark-300">
    ₹{cgstAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2
    })}
  </span>
</div>

<div className="flex justify-between text-sm">
  <span className="text-dark-500">
    SGST ({sgstRate}%)
  </span>

  <span className="font-mono text-dark-300">
    ₹{sgstAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2
    })}
  </span>
</div>
              <div className="flex justify-between text-base font-bold bg-dark-900 rounded-lg px-3 py-2 mt-2">
                <span className="text-gold-400">Final Total</span>
                <span className="font-mono text-gold-400 text-lg">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-dark-900 rounded-lg border border-dark-700">
              <span className="text-xs text-dark-400 uppercase tracking-wide">Amount in Words: </span>
              <span className="text-xs text-dark-300 italic">{numberToWords(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-4">
          <button onClick={handleSave} className="gold-btn px-8 py-3 text-base" disabled={saving}>
            <FiSave size={16} /> {saving ? 'Saving...' : (editId ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>
      </div>
    </>
  );
}