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

  const sgstRate = invoice.gstRate / 2;
  const cgstRate = invoice.gstRate / 2;

  const sgstAmount = invoice.gstAmount / 2;
  const cgstAmount = invoice.gstAmount / 2;

  const items = invoice.items.map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.name}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">₹${item.amount.toFixed(2)}</td>
      <td class="text-right">₹${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

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
      min-height:297mm;
      padding:12mm;
      margin:auto;
    }

    /* HEADER */

    .top-title{
      text-align:center;
      font-size:20px;
      font-weight:bold;
      letter-spacing:3px;
      border:2px solid #B8860B;
      padding:8px;
      margin-bottom:14px;
      color:#111;
    }

    .header{
      border-bottom:3px solid #B8860B;
      padding-bottom:12px;
      margin-bottom:15px;
    }

    .shop-header{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
    .logo{
  width:150px;
  height:150px;
  object-fit:contain;
  margin-bottom:5px;
}

    .shop-center{
      flex:1;
      text-align:center;
    }

    .shop-name{
      font-size:30px;
      font-weight:bold;
      color:#8B6914;
      letter-spacing:1px;
      margin-bottom:5px;
    }

    .shop-details{
      font-size:11px;
      color:#333;
      line-height:1.6;
      margin-top:2px;
    }

    .gst-badge{
      background:#111;
      color:#D4AF37;
      padding:4px 12px;
      border-radius:4px;
      font-size:11px;
      font-weight:bold;
      display:inline-block;
      margin-top:7px;
    }

    /* INFO */

    .info-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
      margin-bottom:15px;
    }

    .info-box{
      border:1px solid #ccc;
      border-radius:5px;
      padding:10px;
      min-height:95px;
    }

    .info-label{
      font-size:10px;
      color:#666;
      text-transform:uppercase;
      letter-spacing:0.5px;
    }

    .info-value{
      font-weight:bold;
      font-size:13px;
      margin-top:4px;
    }

    /* TABLE */

    table{
      width:100%;
      border-collapse:collapse;
      margin-bottom:15px;
      table-layout:fixed;
    }

    th{
      background:#111;
      color:#D4AF37;
      border:1px solid #333;
      padding:8px 6px;
      font-size:11px;
      text-align:center;
    }

    td{
      border:1px solid #ccc;
      padding:7px 6px;
      font-size:11px;
      vertical-align:middle;
      word-wrap:break-word;
    }

    table th:nth-child(1),
    table td:nth-child(1){
      width:8%;
      text-align:center;
    }

    table th:nth-child(2),
    table td:nth-child(2){
      width:42%;
      text-align:left;
    }

    table th:nth-child(3),
    table td:nth-child(3){
      width:15%;
      text-align:center;
    }

    table th:nth-child(4),
    table td:nth-child(4){
      width:17%;
      text-align:right;
    }

    table th:nth-child(5),
    table td:nth-child(5){
      width:18%;
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
      width:320px;
      margin-left:auto;
      border:1px solid #ddd;
    }

    .total-row{
      display:flex;
      justify-content:space-between;
      padding:8px 10px;
      border-bottom:1px solid #eee;
      font-size:12px;
    }

    .grand-total{
      background:#111;
      color:#D4AF37;
      font-weight:bold;
      font-size:15px;
      padding:10px;
      display:flex;
      justify-content:space-between;
    }

    /* WORDS */

    .words-box{
      margin-top:12px;
      border:1px solid #D4AF37;
      background:#fffbf0;
      padding:10px;
      font-size:11px;
      line-height:1.6;
    }

    /* FOOTER */

    .footer{
      margin-top:25px;
      padding-top:12px;
      border-top:2px solid #B8860B;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }

    .bank-details{
      font-size:11px;
      line-height:1.7;
    }

    .sign-box{
      text-align:right;
      font-size:11px;
    }

    .social-footer{
      margin-top:14px;
      padding-top:10px;
      border-top:1px solid #eee;
      text-align:center;
      font-size:10px;
      color:#666;
      line-height:1.7;
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

      <div style="margin-top:5px">
        ${invoice.customer.phone}
      </div>

      <div style="font-size:10px;color:#555;margin-top:5px;line-height:1.5">
        ${invoice.customer.address || ''}
      </div>

    </div>

    <div class="info-box">

      <div style="margin-bottom:8px">
        <span class="info-label">Invoice No :</span>
        <strong>${invoice.invoiceNo}</strong>
      </div>

      <div>
        <span class="info-label">Date :</span>
<strong>
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

  <!-- FOOTER -->

  <div class="footer">

    <div class="bank-details">

      <p style="font-size:12px;font-weight:bold;color:#8B6914;margin-bottom:6px">

        Terms & Conditions :
        Goods once sold cannot be taken back.

      </p>

    </div>

    <div class="sign-box">

      

    </div>

  </div>

  <!-- SOCIAL -->

  <div class="social-footer">

    ${shop.socialMedia?.facebook ? `FB : ${shop.socialMedia.facebook} &nbsp;&nbsp;` : ''}

    ${shop.socialMedia?.instagram ? `IG : ${shop.socialMedia.instagram} &nbsp;&nbsp;` : ''}

    ${shop.socialMedia?.youtube ? `YT : ${shop.socialMedia.youtube}` : ''}

    <br/>

    Thank you for visiting us!

  </div>

</div>

</body>
</html>`;
}
// Generate Quotation HTML
function generateQuotationHTML(invoice, shop) {
  const items = invoice.items.map((item, i) => `
    <tr>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:5px 8px">${item.name}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${item.quantity}</td>
     
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:right">₹${item.amount.toFixed(2)}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:right">₹${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; }
    .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: #D4AF37; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
    .shop-name { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
    .shop-sub { font-size: 10px; color: #c0a060; margin-top: 4px; }
    .quot-title { font-size: 22px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #1a1a1a; border: 2px solid #B8860B; padding: 8px; margin-bottom: 15px; text-transform: uppercase; }
    .client-box { background: #fffbf0; border-left: 4px solid #D4AF37; padding: 12px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th { background: #1a1a1a; color: #D4AF37; padding: 8px; text-align: center; border: 1px solid #333; font-size: 11px; }
    .total-box { background: #1a1a1a; color: #D4AF37; text-align: right; padding: 12px 15px; font-size: 16px; font-weight: bold; }
    .words { background: #f9f3e3; border: 1px solid #D4AF37; padding: 10px; margin-bottom: 15px; font-size: 11px; }
    .payment-box { border: 1px solid #D4AF37; padding: 12px; margin-bottom: 15px; border-radius: 4px; }
    .notes-box { background: #fff8e7; border-left: 4px solid #ff8c00; padding: 10px; margin-bottom: 15px; font-size: 11px; }
    .contact-box { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .footer-social { text-align: center; background: #1a1a1a; color: #D4AF37; padding: 8px; border-radius: 4px; font-size: 10px; margin-top: 10px; }
    .header{
  position:relative;
  text-align:center;
  border-bottom:3px solid #B8860B;
  padding-bottom:12px;
  margin-bottom:15px;
}

.logo{
  position:absolute;
  top:0;
  right:0;
  width:100px;
  height:100px;
  object-fit:contain;
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

</div>

  <div class="quot-title">Quotation</div>

  <div class="client-box">
    <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px">To</div>
    <div style="font-size:15px;font-weight:bold;color:#1a1a1a;margin:3px 0">${invoice.customer.name}</div>
    <div>${invoice.customer.phone}</div>
    ${invoice.customer.address ? `<div style="color:#555;font-size:11px">${invoice.customer.address}</div>` : ''}
    <div style="margin-top:6px;font-size:11px"><strong>Ref No:</strong> ${invoice.invoiceNo} &nbsp;&nbsp; <strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Product / Description</th><th>Qty</th><th>Price per unit</th><th>Total Price</th></tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  <div style="margin-left:auto;width:300px;margin-bottom:15px">
    <div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid #eee"><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid #eee"><span>GST (${invoice.gstRate}%)</span><span>₹${invoice.gstAmount.toFixed(2)}</span></div>
  </div>
  <div class="total-box">Total Amount: ₹${invoice.totalAmount.toFixed(2)}</div>

  <div class="words">
    <strong>Amount in Words:</strong> ${numberToWords(invoice.totalAmount)}
  </div>

  ${shop.bankName || shop.accountNo ? `
  <div class="payment-box">
    <div style="font-size:13px;font-weight:bold;color:#8B6914;margin-bottom:8px">Payment Information</div>
    ${shop.bankName ? `<div><strong>Bank:</strong> ${shop.bankName}</div>` : ''}
    ${shop.accountHolder ? `<div><strong>Account Name:</strong> ${shop.accountHolder}</div>` : ''}
    ${shop.accountNo ? `<div><strong>Account No:</strong> ${shop.accountNo}</div>` : ''}
    ${shop.ifscCode ? `<div><strong>IFSC Code:</strong> ${shop.ifscCode}</div>` : ''}
    ${shop.upiId ? `<div><strong>UPI ID:</strong> ${shop.upiId}</div>` : ''}
  </div>` : ''}

  <div class="contact-box">
    <div>
      <div style="font-size:13px;font-weight:bold;color:#8B6914;margin-bottom:6px">Contact Information</div>
      <div>${shop.name}</div>
      <div>${shop.address}</div>
      <div>Ph: ${shop.phone1}</div>
      <div>Mob: ${shop.phone2}</div>
      ${shop.email ? `<div>Email: ${shop.email}</div>` : ''}
      <div>GSTIN: ${shop.gstNo}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#666;margin-bottom:30px"></div>
      <div style="border-top:1px solid #ccc;padding-top:8px">
        
      </div>
    </div>
  </div>

  <div class="notes-box">
    <strong>Note:</strong><br/>
    ${(shop.quotationNotes || '1. Transportation charges extra.\n2. Installation is not included in this quote.').split('\n').join('<br/>')}
  </div>

  <div class="footer-social">
    ${shop.socialMedia?.facebook ? `📘 ${shop.socialMedia.facebook}   ` : ''}
    ${shop.socialMedia?.instagram ? `📸 ${shop.socialMedia.instagram}   ` : ''}
    ${shop.socialMedia?.youtube ? `▶️ ${shop.socialMedia.youtube}   ` : ''}
    ${shop.socialMedia?.whatsapp ? `💬 ${shop.socialMedia.whatsapp}` : ''}
    <br/>Thank you for considering ${shop.name}!
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
    if (!shop) shop = { name: 'Jeduthun Musicals', address: '314A/17, North Main Road, Valliyur', phone1: '04637-213875', phone2: '+91 8838858275', gstNo: '33KVOPS8216M1ZM', socialMedia: {}, quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.' };

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
    if (!shop) shop = { name: 'Jeduthun Musicals', address: '314A/17, North Main Road, Valliyur', phone1: '04637-213875', phone2: '+91 8838858275', gstNo: '33KVOPS8216M1ZM', socialMedia: {}, quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.' };

    const html = type === 'quotation' ? generateQuotationHTML(invoiceData, shop) : generateInvoiceHTML(invoiceData, shop);
    res.json({ success: true, html });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /pdf/download — generates real PDF via puppeteer and sends as download
// Body: { invoiceId, type: 'invoice'|'quotation' }
router.post('/download', async (req, res) => {
  let browser;

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
        socialMedia: {},
        quotationNotes:
          '1. Transportation charges extra.\n2. Installation is not included in this quote.'
      };
    }

    const html =
      type === 'quotation'
        ? generateQuotationHTML(invoice, shop)
        : generateInvoiceHTML(invoice, shop);

    const puppeteer = require('puppeteer');

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    await browser.close();

    // ===== SAVE PDF =====

    const pdfDir = path.join(__dirname, '../public/pdfs');

    // create folder if not exists
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const label = type === 'quotation'
      ? 'Quotation'
      : 'Invoice';

    const safeCustomerName = invoice.customer.name
      .replace(/[^a-zA-Z0-9]/g, '_');

    const filename =
      `${label}-${invoice.invoiceNo}-${safeCustomerName}.pdf`;

    const filePath = path.join(pdfDir, filename);

    // save file
    fs.writeFileSync(filePath, pdfBuffer);

    // PUBLIC URL
    const pdfUrl =
      `${req.protocol}://${req.get('host')}/public/pdfs/${filename}`;

    // RETURN JSON
    return res.json({
      success: true,
      pdfUrl,
      filename
    });

  } catch (err) {

    if (browser) {
      await browser.close().catch(() => {});
    }

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
      process.env.FRONTEND_URL || 'http://localhost:3000';

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
// POST /pdf/download-from-data — generates PDF from raw invoice data (before save)
// Body: { invoiceData, type }
router.post('/download-from-data', async (req, res) => {
  let browser;
  try {
    const { invoiceData, type = 'quotation' } = req.body;

    let shop = await Shop.findOne();
    if (!shop) shop = {
      name: 'Jeduthun Musicals',
      address: '314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu',
      phone1: '04637-213875', phone2: '+91 8838858275',
      gstNo: '33KVOPS8216M1ZM', socialMedia: {},
      quotationNotes: '1. Transportation charges extra.\n2. Installation is not included in this quote.'
    };

    const html = type === 'quotation'
      ? generateQuotationHTML(invoiceData, shop)
      : generateInvoiceHTML(invoiceData, shop);

    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();

    const label = type === 'quotation' ? 'Quotation' : 'Invoice';
    const customerName = invoiceData?.customer?.name?.replace(/\s+/g, '_') || 'Customer';
    const invoiceNo = invoiceData?.invoiceNo || 'DRAFT';
    const filename = `${label}-${invoiceNo}-${customerName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('PDF download error:', err.message);
    res.status(500).json({ success: false, message: 'PDF generation failed: ' + err.message });
  }
});

module.exports = router;