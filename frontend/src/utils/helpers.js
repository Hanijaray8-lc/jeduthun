export function numberToWords(num) {
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

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function getWhatsAppUrl(phone, message) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function printHTML(html) {
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups for this site to print.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// Download a PDF blob directly to device
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// ─── The fix for WhatsApp not opening ────────────────────────────────────────
// Browsers block window.open() called inside async/await (after await).
// Solution: open the window IMMEDIATELY on click (synchronous),
// then navigate it to WhatsApp URL after the async PDF call completes.
//
// Usage:
//   const waWindow = openWindowImmediately();   // call this FIRST, synchronously
//   const res = await pdfAPI.downloadPDF(...);  // then do async work
//   downloadBlob(res.data, filename);
//   navigateWindow(waWindow, getWhatsAppUrl(phone, msg));

export function openWindowImmediately() {
  // Open a blank window synchronously — browser allows this inside a click handler
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups for this site so WhatsApp can open.');
    return null;
  }
  // Show a loading message while PDF generates
  win.document.write(`
    <html><head><title>Opening WhatsApp...</title>
    <style>
      body { margin:0; display:flex; align-items:center; justify-content:center;
             height:100vh; background:#111; color:#D4AF37;
             font-family:sans-serif; flex-direction:column; gap:12px; }
      .spinner { width:40px; height:40px; border:3px solid #333;
                 border-top-color:#D4AF37; border-radius:50%;
                 animation: spin 0.8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style></head>
    <body>
      <div class="spinner"></div>
      <p>Generating PDF & opening WhatsApp...</p>
    </body></html>
  `);
  return win;
}

export function navigateWindow(win, url) {
  if (!win) return;
  win.location.href = url;
}