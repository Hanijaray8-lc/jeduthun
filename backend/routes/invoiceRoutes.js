const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// GET all invoices with filters
router.get('/', async (req, res) => {
  try {
    const { month, year, date, search, type } = req.query;
    let query = {};

    if (type) query.type = type;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { invoiceNo: { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET next invoice number (before /:id to avoid being caught by it)
router.get('/meta/next-number', async (req, res) => {
  try {
    const last = await Invoice.findOne({ type: 'invoice' }).sort({ createdAt: -1 });
    let nextNo = 'INV-001';
    if (last && last.invoiceNo) {
      const parts = last.invoiceNo.split('-');
      const num = parseInt(parts[parts.length - 1]) + 1;
      nextNo = `INV-${String(num).padStart(3, '0')}`;
    }
    res.json({ success: true, nextNo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET customer by phone (before /:id to avoid being caught by it)
router.get('/customer/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const invoice = await Invoice.findOne({ 'customer.phone': phone }).sort({ createdAt: -1 });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: { name: invoice.customer.name, address: invoice.customer.address, phone: invoice.customer.phone } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create invoice
router.post('/', async (req, res) => {
  try {
    console.log('\n\n==========================================');
    console.log('📝 RECEIVED INVOICE DATA:');
    console.log('Item 0:', JSON.stringify(req.body.items?.[0], null, 2));
    console.log('==========================================\n\n');
    
    const invoice = new Invoice(req.body);
    const saved = await invoice.save();
    
    console.log('==========================================');
    console.log('✨ SAVED IN DB - Item 0:');
    console.log(JSON.stringify(saved.items?.[0], null, 2));
    console.log('==========================================\n\n');
    
    res.status(201).json({ success: true, data: saved, message: 'Invoice created successfully' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    
    // Handle duplicate invoice number
    if (err.code === 11000 && err.keyPattern?.invoiceNo) {
      try {
        // Get the last invoice and generate next number
        const last = await Invoice.findOne({ type: 'invoice' }).sort({ createdAt: -1 });
        let nextNo = 'INV-001';
        if (last && last.invoiceNo) {
          const parts = last.invoiceNo.split('-');
          const num = parseInt(parts[parts.length - 1]) + 1;
          nextNo = `INV-${String(num).padStart(3, '0')}`;
        }
        
        // Update request body with new invoice number
        req.body.invoiceNo = nextNo;
        console.log('⚠️ Duplicate invoice number, using:', nextNo);
        
        // Try saving again with new number
        const invoice = new Invoice(req.body);
        const saved = await invoice.save();
        
        return res.status(201).json({ 
          success: true, 
          data: saved, 
          message: `Invoice created with number ${nextNo}` 
        });
      } catch (retryErr) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to create invoice: ' + retryErr.message 
        });
      }
    }
    
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update invoice
router.put('/:id', async (req, res) => {
  try {
    console.log('\n\n==========================================');
    console.log('📝 UPDATING INVOICE:');
    console.log('Item 0:', JSON.stringify(req.body.items?.[0], null, 2));
    console.log('==========================================\n\n');
    
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    console.log('✨ Updated in DB - Item 0:');
    console.log(JSON.stringify(invoice.items?.[0], null, 2));
    
    res.json({ success: true, data: invoice, message: 'Invoice updated successfully' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
