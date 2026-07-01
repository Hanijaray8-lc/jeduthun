import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiShoppingBag, FiCreditCard, FiGlobe } from 'react-icons/fi';
import { shopAPI } from '../utils/api';

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: 'Jeduthun Musicals',
    address: '314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu',
    phone1: '04637-213875',
    phone2: '+91 8838858275',
    gstNo: '33KVOPS8216M1ZM',
    email: '',
    website: 'https://jeduthunmusicals.com/',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    accountHolder: '',
    upiId: '',
    socialMedia: { facebook: '', instagram: '', youtube: '', whatsapp: '' },
    quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.'
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopAPI.get().then(res => {
      const d = res.data.data;
      setForm({
        name: d.name || '',
        address: d.address || '',
        phone1: d.phone1 || '',
        phone2: d.phone2 || '',
        gstNo: d.gstNo || '',
        email: d.email || '',
        website: d.website || 'https://jeduthunmusicals.com/',
        bankName: d.bankName || '',
        accountNo: d.accountNo || '',
        ifscCode: d.ifscCode || '',
        accountHolder: d.accountHolder || '',
        upiId: d.upiId || '',
        socialMedia: d.socialMedia || { facebook: '', instagram: '', youtube: '', whatsapp: '' },
        quotationNotes: d.quotationNotes || '1. Transportation charges extra.\n2. Installation is not included in this quote.'
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await shopAPI.update(form);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setSocial = (field, value) => setForm(f => ({ ...f, socialMedia: { ...f.socialMedia, [field]: value } }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gold-400 animate-pulse font-serif text-lg">Loading...</div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-dark-400 text-sm mt-1">Shop info, bank details & social media</p>
        </div>
        <button onClick={handleSave} className="gold-btn" disabled={saving}>
          <FiSave size={15} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Shop Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FiShoppingBag className="text-gold-500" />
          <h2 className="font-serif text-gold-400 font-semibold">Shop Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Shop Name</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <textarea className="input-field resize-none h-20" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone 1</label>
            <input className="input-field" value={form.phone1} onChange={e => set('phone1', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone 2 / Mobile</label>
            <input className="input-field" value={form.phone2} onChange={e => set('phone2', e.target.value)} />
          </div>
          <div>
            <label className="label">GST Number</label>
            <input className="input-field font-mono" value={form.gstNo} onChange={e => set('gstNo', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field" type="email" placeholder="shop@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          
        </div>
      </div>

      {/* Bank Details */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FiCreditCard className="text-gold-500" />
          <h2 className="font-serif text-gold-400 font-semibold">Bank / Payment Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Bank Name</label>
            <input className="input-field" placeholder="e.g. State Bank of India" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
          </div>
          <div>
            <label className="label">Account Holder Name</label>
            <input className="input-field" value={form.accountHolder} onChange={e => set('accountHolder', e.target.value)} />
          </div>
          <div>
            <label className="label">Account Number</label>
            <input className="input-field font-mono" value={form.accountNo} onChange={e => set('accountNo', e.target.value)} />
          </div>
          <div>
            <label className="label">IFSC Code</label>
            <input className="input-field font-mono" value={form.ifscCode} onChange={e => set('ifscCode', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">UPI ID</label>
            <input className="input-field" placeholder="yourname@upi" value={form.upiId} onChange={e => set('upiId', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FiGlobe className="text-gold-500" />
          <h2 className="font-serif text-gold-400 font-semibold">Social Media</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Facebook Page</label>
            <input className="input-field" placeholder="facebook.com/yourpage" value={form.socialMedia.facebook} onChange={e => setSocial('facebook', e.target.value)} />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="input-field" placeholder="@yourhandle" value={form.socialMedia.instagram} onChange={e => setSocial('instagram', e.target.value)} />
          </div>
          <div>
            <label className="label">YouTube</label>
            <input className="input-field" placeholder="youtube.com/@yourchannel" value={form.socialMedia.youtube} onChange={e => setSocial('youtube', e.target.value)} />
          </div>
          <div>
            <label className="label">WhatsApp Number</label>
            <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.socialMedia.whatsapp} onChange={e => setSocial('whatsapp', e.target.value)} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input-field" placeholder="https://jeduthunmusicals.com/" value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Quotation Notes */}
      <div className="card">
        <h2 className="font-serif text-gold-400 font-semibold mb-4">Quotation Notes</h2>
        <label className="label">Notes (shown at bottom of quotation)</label>
        <textarea
          className="input-field resize-none h-28"
          value={form.quotationNotes}
          onChange={e => set('quotationNotes', e.target.value)}
          placeholder="1. Transportation charges extra.&#10;2. Installation is not included in this quote."
        />
        <p className="text-xs text-dark-500 mt-1">Each line will appear as a numbered note on the quotation PDF</p>
      </div>

      <div className="flex justify-end pb-6">
        <button onClick={handleSave} className="gold-btn px-8" disabled={saving}>
          <FiSave size={15} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}
