const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Shop = require('../models/Shop');
const fs = require('fs');
const path = require('path');
// Helper: number to words
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

// Generate Invoice HTML
function generateInvoiceHTML(invoice, shop) {

  const sgstRate = invoice.sgstRate || invoice.gstRate / 2;
  const cgstRate = invoice.cgstRate || invoice.gstRate / 2;

  const sgstAmount = invoice.sgstAmount || invoice.gstAmount / 2;
  const cgstAmount = invoice.cgstAmount || invoice.gstAmount / 2;

  const items = invoice.items.map((item, i) => {
    const mrpVal = Number(item.mrpRate) || Number(item.rate) || Number(item.amount) || 0;
    const rateVal = Number(item.rate) || Number(item.amount) || 0;
    const totalVal = Number(item.total) || 0;
    return `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.name}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">₹${mrpVal.toFixed(2)}</td>
      <td class="text-right">₹${rateVal.toFixed(2)}</td>
      <td class="text-right">₹${totalVal.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <style>

    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
    }

    body{
      font-family:Arial,sans-serif;
      font-size:12px;
      color:#111;
      background:#fff;
    }

    .page{
      width:210mm;
      max-height:297mm;
      padding:8mm;
      margin:auto;
      overflow:hidden;
      display:flex;
      flex-direction:column;
    }

    /* HEADER */

    .top-title{
      text-align:center;
      font-size:18px;
      font-weight:bold;
      letter-spacing:2px;
      border:1px solid #B8860B;
      padding:5px;
      margin-bottom:8px;
      color:#111;
    }

    .header{
      border-bottom:2px solid #B8860B;
      padding-bottom:8px;
      margin-bottom:8px;
    }

    .shop-header{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
    .logo{
  width:100px;
  height:100px;
  object-fit:contain;
  margin-bottom:2px;
}

    .shop-center{
      flex:1;
      text-align:center;
    }

    .shop-name{
      font-size:22px;
      font-weight:bold;
      color:#8B6914;
      letter-spacing:1px;
      margin-bottom:2px;
    }

    .shop-details{
      font-size:10px;
      color:#333;
      line-height:1.4;
      margin-top:0px;
    }

    .gst-badge{
      background:#111;
      color:#D4AF37;
      padding:2px 8px;
      border-radius:3px;
      font-size:9px;
      font-weight:bold;
      display:inline-block;
      margin-top:3px;
    }

    /* INFO */

    .info-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;
      margin-bottom:8px;
    }

    .info-box{
      border:1px solid #ccc;
      border-radius:3px;
      padding:6px;
      min-height:auto;
    }

    .info-label{
      font-size:9px;
      color:#666;
      text-transform:uppercase;
      letter-spacing:0.3px;
    }

    .info-value{
      font-weight:bold;
      font-size:12px;
      margin-top:2px;
    }

    /* TABLE */

    table{
      width:100%;
      border-collapse:collapse;
      margin-bottom:6px;
      table-layout:fixed;
      font-size:10px;
    }

    th{
      background:#111;
      color:#D4AF37;
      border:1px solid #333;
      padding:4px 3px;
      font-size:9px;
      text-align:center;
    }

    td{
      border:1px solid #ccc;
      padding:3px 3px;
      font-size:10px;
      vertical-align:middle;
      word-wrap:break-word;
    }

    table th:nth-child(1),
    table td:nth-child(1){
      width:5%;
      text-align:center;
    }

    table th:nth-child(2),
    table td:nth-child(2){
      width:30%;
      text-align:left;
    }

    table th:nth-child(3),
    table td:nth-child(3){
      width:10%;
      text-align:center;
    }

    table th:nth-child(4),
    table td:nth-child(4){
      width:15%;
      text-align:right;
    }

    table th:nth-child(5),
    table td:nth-child(5){
      width:15%;
      text-align:right;
    }

    table th:nth-child(6),
    table td:nth-child(6){
      width:25%;
      text-align:right;
    }

    .text-right{
      text-align:right;
    }

    .text-center{
      text-align:center;
    }

    /* TOTALS */

    .totals{
      width:280px;
      margin-left:auto;
      border:1px solid #ddd;
    }

    .total-row{
      display:flex;
      justify-content:space-between;
      padding:4px 6px;
      border-bottom:1px solid #eee;
      font-size:10px;
    }

    .grand-total{
      background:#111;
      color:#D4AF37;
      font-weight:bold;
      font-size:12px;
      padding:6px;
      display:flex;
      justify-content:space-between;
    }

    /* WORDS */

    .words-box{
      margin-top:6px;
      border:1px solid #D4AF37;
      background:#fffbf0;
      padding:6px;
      font-size:10px;
      line-height:1.4;
    }

    /* FOOTER */

    .footer{
      margin-top:auto;
      padding-top:6px;
      border-top:1px solid #B8860B;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;
    }

    .bank-details{
      font-size:10px;
      line-height:1.4;
    }

    .sign-box{
      text-align:right;
      font-size:10px;
    }

    .social-footer{
      margin-top:2px;
      padding-top:2px;
      border-top:1px solid #eee;
      text-align:center;
      font-size:9px;
      color:#666;
      line-height:1.2;
    }

  </style>
</head>

<body>

<div class="page">

  <!-- TOP TITLE -->

  <div class="top-title">
    TAX INVOICE
  </div>

  <!-- HEADER -->

  <div class="header">

 <div class="shop-header">

  <img 
    src="https://jeduthun.onrender.com/public/logo.png"
    class="logo"
  />

 

      <div class="shop-center">

        <div class="shop-name">
          ${shop.name}
        </div>

        <div class="shop-details">
          ${shop.address}
        </div>

        <div class="shop-details">
          Ph : ${shop.phone1} | ${shop.phone2}
        </div>
        ${shop.website ? `<div class="shop-details">Website: ${shop.website}</div>` : ''}
        ${shop.email ? `<div class="shop-details">Email: ${shop.email}</div>` : ''}

        <span class="gst-badge">
          GSTIN : ${shop.gstNo || 'N/A'}
        </span>

      </div>

    </div>

  </div>

  <!-- CUSTOMER INFO -->

  <div class="info-grid">

    <div class="info-box">

      <div class="info-label">
        Bill To
      </div>

      <div class="info-value">
        ${invoice.customer.name}
      </div>

      <div style="margin-top:2px;font-size:10px">
        ${invoice.customer.phone}
      </div>

      <div style="font-size:9px;color:#555;margin-top:2px;line-height:1.3">
        ${invoice.customer.address || ''}
      </div>

    </div>

    <div class="info-box">

      <div style="margin-bottom:4px">
        <span class="info-label">Invoice No :</span>
        <strong style="font-size:11px">${invoice.invoiceNo}</strong>
      </div>

      <div>
        <span class="info-label">Date :</span>
<strong style="font-size:10px">
        ${new Date(invoice.date).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})}
        </strong>

      </div>

    </div>

  </div>

  <!-- ITEMS TABLE -->

  <table>

    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Qty</th>
        <th>MRP Rate</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>

    <tbody>
      ${items}
    </tbody>

  </table>

  <!-- TOTALS -->

  <div class="totals">

    <div class="total-row">
      <span>Subtotal</span>
      <span>₹${invoice.subtotal.toFixed(2)}</span>
    </div>

    <div class="total-row">
      <span>SGST (${sgstRate}%)</span>
      <span>₹${sgstAmount.toFixed(2)}</span>
    </div>

    <div class="total-row">
      <span>CGST (${cgstRate}%)</span>
      <span>₹${cgstAmount.toFixed(2)}</span>
    </div>

    <div class="grand-total">
      <span>TOTAL</span>
      <span>₹${invoice.totalAmount.toFixed(2)}</span>
    </div>

  </div>

  <!-- WORDS -->

  <div class="words-box">

    <strong>Amount in Words :</strong>

    ${numberToWords(invoice.totalAmount)}

  </div>

  ${shop.bankName || shop.accountNo || shop.ifscCode || shop.upiId || shop.accountHolder ? `
  <div class="payment-box">
    <div class="info-label">Payment Information</div>
    ${shop.bankName ? `<div class="info-value" style="font-size:10px;font-weight:normal;">Bank: ${shop.bankName}</div>` : ''}
    ${shop.accountHolder ? `<div class="info-value" style="font-size:10px;font-weight:normal;">Account Name: ${shop.accountHolder}</div>` : ''}
    ${shop.accountNo ? `<div class="info-value" style="font-size:10px;font-weight:normal;">Account No: ${shop.accountNo}</div>` : ''}
    ${shop.ifscCode ? `<div class="info-value" style="font-size:10px;font-weight:normal;">IFSC Code: ${shop.ifscCode}</div>` : ''}
    ${shop.upiId ? `<div class="info-value" style="font-size:10px;font-weight:normal;">UPI ID: ${shop.upiId}</div>` : ''}
  </div>` : ''}

  <!-- FOOTER -->

  <div class="footer">

    <div class="bank-details">

      <p style="font-size:10px;font-weight:bold;color:#8B6914;margin-bottom:0px;line-height:1.3">

        Terms & Conditions :<br/>
        Goods once sold cannot be taken back.

      </p>

    </div>

    <div class="sign-box">

      

    </div>

  </div>

  <!-- SOCIAL -->

<div class="footer-social">

    <div class="social-links">
      ${shop.socialMedia?.facebook ? `📘 ${shop.socialMedia.facebook} &nbsp;&nbsp;` : ''}
      ${shop.socialMedia?.instagram ? `📸 ${shop.socialMedia.instagram} &nbsp;&nbsp;` : ''}
      ${shop.socialMedia?.youtube ? `▶️ ${shop.socialMedia.youtube} &nbsp;&nbsp;` : ''}
      ${shop.socialMedia?.whatsapp ? `💬 ${shop.socialMedia.whatsapp}` : ''}
    </div>
    ${shop.website ? `<div class="social-links">🌐 ${shop.website}</div>` : ''}

    <div class="thankyou">
        Thank You For Considering ${shop.name}!
    </div>

    <div class="subtext">
        We appreciate the opportunity to serve you.
    </div>

</div>

</div>

</body>
</html>`;
}
// Generate Quotation HTML
function generateQuotationHTML(invoice, shop) {
  const sgstRate = invoice.sgstRate || invoice.gstRate / 2;
  const cgstRate = invoice.cgstRate || invoice.gstRate / 2;

  const sgstAmount = invoice.sgstAmount || invoice.gstAmount / 2;
  const cgstAmount = invoice.cgstAmount || invoice.gstAmount / 2;

  const items = invoice.items.map((item, i) => {
    const mrpVal = Number(item.mrpRate) || Number(item.rate) || Number(item.amount) || 0;
    const rateVal = Number(item.rate) || Number(item.amount) || 0;
    const totalVal = Number(item.total) || 0;
    return `
    <tr>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:5px 8px">${item.name}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${item.quantity}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:right">₹${mrpVal.toFixed(2)}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:right">₹${rateVal.toFixed(2)}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:right">₹${totalVal.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; }
    .page { width: 210mm; max-height: 297mm; padding: 8mm; margin: 0 auto; overflow: hidden; display: flex; flex-direction: column; }
    .header { 
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a1a, #2d2d2d); 
      color: #D4AF37; 
      padding: 12px 12px 10px 12px;
      margin-bottom: 8px; 
      border-radius: 3px;
      text-align: center;
      border-bottom: 2px solid #B8860B;
    }
    .shop-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
    .shop-sub { font-size: 9px; color: #c0a060; margin-top: 2px; line-height: 1.3; }
    .quot-title { font-size: 16px; font-weight: bold; letter-spacing: 2px; text-align: center; color: #1a1a1a; border: 1px solid #B8860B; padding: 4px; margin-bottom: 8px; text-transform: uppercase; }
    .client-box { background: #fffbf0; border-left: 3px solid #D4AF37; padding: 8px; margin-bottom: 8px; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10px; }
    th { background: #1a1a1a; color: #D4AF37; padding: 4px 3px; text-align: center; border: 1px solid #333; font-size: 9px; }
    td { border: 1px solid #ccc; padding: 2px 3px; font-size: 10px; }
    .total-box { background: #1a1a1a; color: #D4AF37; text-align: right; padding: 6px 8px; font-size: 13px; font-weight: bold; }
    .words { background: #f9f3e3; border: 1px solid #D4AF37; padding: 6px; margin-bottom: 6px; font-size: 10px; line-height: 1.3; }
    .payment-box { border: 1px solid #D4AF37; padding: 8px; margin-bottom: 6px; border-radius: 3px; font-size: 10px; }
    .notes-box { background: #fff8e7; border-left: 3px solid #ff8c00; padding: 6px; margin-bottom: 6px; font-size: 9px; line-height: 1.3; }
    .contact-box { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; font-size: 10px; }
    .footer-social{
    text-align:center;
    background:linear-gradient(135deg,#1a1a1a,#2d2d2d);
    color:#D4AF37;
    padding:10px 15px;
    border-radius:6px;
    margin-top:10px;
    border-top:2px solid #D4AF37;
}

.footer-social .social-links{
    font-size:10px;
    margin-bottom:8px;
    line-height:1.6;
}

.footer-social .thankyou{
    font-size:15px;
    font-weight:bold;
    color:#fff;
    letter-spacing:0.5px;
}

.footer-social .subtext{
    font-size:10px;
    color:#d8d8d8;
    margin-top:4px;
}
    .logo {
      position: absolute;
      top: 0;
      right: 0;
      width: 70px;
      height: 70px;
      object-fit: contain;
    }
  </style>
</head>
<body>
<div class="page">
 <div class="header">

  <img 
    src="https://jeduthun.onrender.com/public/logo.png"
    class="logo"
  />

  <div class="shop-name">
    ${shop.name}
  </div>

  <div class="shop-sub">
    ${shop.address}
  </div>

  <div class="shop-sub">
    Ph: ${shop.phone1} | ${shop.phone2}
  </div>

  <div class="shop-sub">
    GSTIN: ${shop.gstNo}
  </div>
  ${shop.website ? `<div class="shop-sub">Website: ${shop.website}</div>` : ''}
  ${shop.email ? `<div class="shop-sub">Email: ${shop.email}</div>` : ''}

</div>

  <div class="quot-title">Quotation</div>

  <div class="client-box">
    <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px">To</div>
    <div style="font-size:13px;font-weight:bold;color:#1a1a1a;margin:2px 0">${invoice.customer.name}</div>
    <div style="font-size:10px">${invoice.customer.phone}</div>
    ${invoice.customer.address ? `<div style="color:#555;font-size:9px">${invoice.customer.address}</div>` : ''}
    <div style="margin-top:4px;font-size:9px"><strong>Ref No:</strong> ${invoice.invoiceNo} &nbsp;&nbsp; <strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Product / Description</th><th>Qty</th><th>MRP Rate</th><th>Price per unit</th><th>Total Price</th></tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  <div style="margin-left:auto;width:280px;margin-bottom:6px">
    <div style="display:flex;justify-content:space-between;padding:2px 6px;border-bottom:1px solid #eee;font-size:10px"><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:2px 6px;border-bottom:1px solid #eee;font-size:10px"><span>CGST (${cgstRate}%)</span><span>₹${cgstAmount.toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:2px 6px;border-bottom:1px solid #eee;font-size:10px"><span>SGST (${sgstRate}%)</span><span>₹${sgstAmount.toFixed(2)}</span></div>
  </div>
  <div class="total-box">Total Amount: ₹${invoice.totalAmount.toFixed(2)}</div>

  <div class="words">
    <strong>Amount in Words:</strong> ${numberToWords(invoice.totalAmount)}
  </div>

  ${shop.bankName || shop.accountNo ? `
  <div class="payment-box">
    <div style="font-size:11px;font-weight:bold;color:#8B6914;margin-bottom:4px">Payment Information</div>
    ${shop.bankName ? `<div style="font-size:10px"><strong>Bank:</strong> ${shop.bankName}</div>` : ''}
    ${shop.accountHolder ? `<div style="font-size:10px"><strong>Account Name:</strong> ${shop.accountHolder}</div>` : ''}
    ${shop.accountNo ? `<div style="font-size:10px"><strong>Account No:</strong> ${shop.accountNo}</div>` : ''}
    ${shop.ifscCode ? `<div style="font-size:10px"><strong>IFSC Code:</strong> ${shop.ifscCode}</div>` : ''}
    ${shop.upiId ? `<div style="font-size:10px"><strong>UPI ID:</strong> ${shop.upiId}</div>` : ''}
  </div>` : ''}

  <div class="contact-box">
    <div>
      <div style="font-size:11px;font-weight:bold;color:#8B6914;margin-bottom:3px">Contact</div>
      <div style="font-size:10px">${shop.name}</div>
      <div style="font-size:9px">${shop.address}</div>
      <div style="font-size:10px">Ph: ${shop.phone1}</div>
      <div style="font-size:10px">Mob: ${shop.phone2}</div>
      ${shop.email ? `<div style="font-size:10px">Email: ${shop.email}</div>` : ''}
      <div style="font-size:10px">GSTIN: ${shop.gstNo}</div>
    </div>
    <div style="text-align:right;font-size:10px">
      <div style="color:#666;margin-bottom:20px"></div>
      <div style="border-top:1px solid #ccc;padding-top:4px">
        
      </div>
    </div>
  </div>

  <div class="notes-box" style="margin-top:4px">
    <strong style="font-size:10px">Note:</strong><br/>
    <div style="font-size:9px">
      ${(shop.quotationNotes || '1. Transportation charges extra.\\n2. Installation is not included in this quote.').split('\n').join('<br/>')}
    </div>
  </div>

  <div class="footer-social">
    <div style="font-size:9px">
      ${shop.socialMedia?.facebook ? `📘 ${shop.socialMedia.facebook}   ` : ''}
      ${shop.socialMedia?.instagram ? `📸 ${shop.socialMedia.instagram}   ` : ''}
      ${shop.socialMedia?.youtube ? `▶️ ${shop.socialMedia.youtube}   ` : ''}
      ${shop.socialMedia?.whatsapp ? `💬 ${shop.socialMedia.whatsapp}` : ''}
    </div>
    <div style="margin-top:1px">Thank you for considering ${shop.name}!</div>
  </div>
  </div>
</div>
</body>
</html>`;
}

// POST generate PDF
router.post('/generate', async (req, res) => {
  try {
    const { invoiceId, type } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    let shop = await Shop.findOne();
    if (!shop) shop = { name: 'Jeduthun Musicals', address: '314A/17, North Main Road, Valliyur', phone1: '04637-213875', phone2: '+91 8838858275', gstNo: '33KVOPS8216M1ZM', website: 'https://jeduthunmusicals.com/', socialMedia: {}, quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.' };

    const html = type === 'quotation' ? generateQuotationHTML(invoice, shop) : generateInvoiceHTML(invoice, shop);

    // Return HTML for client-side printing/PDF
    res.json({ success: true, html, invoiceNo: invoice.invoiceNo, customerPhone: invoice.customer.phone });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST generate HTML for invoice (return raw HTML)
router.post('/html', async (req, res) => {
  try {
    const { invoiceData, type } = req.body;
    let shop = await Shop.findOne();
    if (!shop) shop = { name: 'Jeduthun Musicals', address: '314A/17, North Main Road, Valliyur', phone1: '04637-213875', phone2: '+91 8838858275', gstNo: '33KVOPS8216M1ZM', website: 'https://jeduthunmusicals.com/', socialMedia: {}, quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.' };

    const html = type === 'quotation' ? generateQuotationHTML(invoiceData, shop) : generateInvoiceHTML(invoiceData, shop);
    res.json({ success: true, html });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /pdf/download — generates HTML file for download/print
// Body: { invoiceId, type: 'invoice'|'quotation' }
router.post('/download', async (req, res) => {
  try {
    const { invoiceId, type = 'quotation' } = req.body;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    let shop = await Shop.findOne();

    if (!shop) {
      shop = {
        name: 'Jeduthun Musicals',
        address: '314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu',
        phone1: '04637-213875',
        phone2: '+91 8838858275',
        gstNo: '33KVOPS8216M1ZM',
        website: 'https://jeduthunmusicals.com/',
        socialMedia: {},
        quotationNotes:
          '1. Transportation charges extra.\n2. Installation is not included in this quote.'
      };
    }

    const html =
      type === 'quotation'
        ? generateQuotationHTML(invoice, shop)
        : generateInvoiceHTML(invoice, shop);

    // ===== SAVE HTML FILE =====
    const htmlDir = path.join(__dirname, '../public/pdfs');

    // create folder if not exists
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }

    const label = type === 'quotation'
      ? 'Quotation'
      : 'Invoice';

    const safeCustomerName = invoice.customer.name
      .replace(/[^a-zA-Z0-9]/g, '_');

    const filename =
      `${label}-${invoice.invoiceNo}-${safeCustomerName}.html`;

    const filePath = path.join(htmlDir, filename);

    // save HTML file
    fs.writeFileSync(filePath, html);

    // PUBLIC URL - Force HTTPS on Render
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host');
    const pdfUrl = `${protocol}://${host}/api/pdf/serve/${invoiceId}?type=${type}`;

    // RETURN JSON
    return res.json({
      success: true,
      pdfUrl,
      filename
    });

  } catch (err) {
    console.error('PDF download error:', err.message);

    res.status(500).json({
      success: false,
      message: 'PDF generation failed: ' + err.message
    });
  }
});
// CREATE SHARE LINK
router.post('/create-share-link', async (req, res) => {
  try {
    const { invoiceId, type = 'invoice' } = req.body;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // frontend url
    const BASE_URL =
      process.env.FRONTEND_URL || 'https://jeduthun.onrender.com';

    // generate public link
    const link = `${BASE_URL}/download-pdf/${invoice._id}?type=${type}`;

    res.json({
      success: true,
      link
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// POST /pdf/download-from-data — generates HTML file from raw invoice data
// Body: { invoiceData, type }
router.post('/download-from-data', async (req, res) => {
  try {
    const { invoiceData, type = 'quotation' } = req.body;

    let shop = await Shop.findOne();
    if (!shop) shop = {
      name: 'Jeduthun Musicals',
      address: '314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu',
      phone1: '04637-213875', phone2: '+91 8838858275',
      gstNo: '33KVOPS8216M1ZM', website: 'https://jeduthunmusicals.com/', socialMedia: {},
      quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.'
    };

    const html = type === 'quotation'
      ? generateQuotationHTML(invoiceData, shop)
      : generateInvoiceHTML(invoiceData, shop);

    const label = type === 'quotation' ? 'Quotation' : 'Invoice';
    const customerName = invoiceData?.customer?.name?.replace(/\s+/g, '_') || 'Customer';
    const invoiceNo = invoiceData?.invoiceNo || 'DRAFT';
    const filename = `${label}-${invoiceNo}-${customerName}.html`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);

  } catch (err) {
    console.error('HTML generation error:', err.message);
    res.status(500).json({ success: false, message: 'HTML generation failed: ' + err.message });
  }
});

// GET /pdf/serve/:invoiceId — Serves HTML dynamically (fixes Render ephemeral file system issue)
router.get('/serve/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const type = req.query.type || 'invoice';

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let shop = await Shop.findOne();
    if (!shop) {
      shop = {
        name: 'Jeduthun Musicals',
        address: '314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu',
        phone1: '04637-213875',
        phone2: '+91 8838858275',
        gstNo: '33KVOPS8216M1ZM',
        email: '',
        website: 'https://jeduthunmusicals.com/',
        email: '',
        website: 'https://jeduthunmusicals.com/',
        socialMedia: {},
        quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.'
      };
    }

    const html = type === 'quotation'
      ? generateQuotationHTML(invoice, shop)
      : generateInvoiceHTML(invoice, shop);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('PDF serve error:', err.message);
    res.status(500).json({ success: false, message: 'Error serving PDF: ' + err.message });
  }
});

module.exports = router;
