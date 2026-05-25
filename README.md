# Jeduthun Musicals - Billing System

A full-stack MERN billing application with black & gold theme.

## Project Structure

```
jeduthun-billing/
├── backend/
│   ├── models/
│   │   ├── Product.js
│   │   ├── Invoice.js
│   │   └── Shop.js
│   ├── routes/
│   │   ├── productRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── shopRoutes.js
│   │   └── pdfRoutes.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.js
    │   ├── pages/
    │   │   ├── ProductsPage.js
    │   │   ├── InvoicePage.js
    │   │   ├── EditInvoicePage.js
    │   │   ├── HistoryPage.js
    │   │   └── SettingsPage.js
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── helpers.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── tailwind.config.js
    └── package.json
```

## Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

> **Note:** No Vite — uses Create React App with standard `react-scripts`.

---

## Features

### 1. Products Page (`/products`)
- Add products with name, amount, unit, HSN code, description
- Edit and delete products
- Live search

### 2. Invoice Page (`/invoice`)
- Customer details: name, phone, address
- Manual invoice number (editable)
- Auto current date
- Product line items with:
  - Search stored products via dropdown
  - Manual product entry (no store needed)
  - Quantity, unit, rate fields
  - Auto-calculated totals
- 18% GST auto-calculated
- Amount in words (Indian format: Lakhs/Crores)
- **Print Bill** — opens A4 print dialog
- **Share Bill on WhatsApp** — prints + opens WhatsApp with customer's number
- **Print Quotation** — opens quotation PDF
- **Share Quotation on WhatsApp** — prints + opens WhatsApp

### 3. Bill History (`/history`)
- Filter by month + year or exact date
- Search by customer name, phone, invoice number
- Per-invoice actions:
  - 👁 View details modal
  - ✏️ Edit invoice
  - 🖨 Print invoice
  - 📤 Share invoice on WhatsApp
  - ⬇️ Download/print quotation
  - 📄 Share quotation on WhatsApp
  - 🗑 Delete

### 4. Settings (`/settings`)
- Shop name, address, phones, GST number, email
- Bank account details (shown in quotation payment section)
- Social media links (shown in PDF footer)
- Quotation notes (default: transportation & installation disclaimers)

---

## PDF / Print Layout

### Invoice (A4)
- Header: Shop name, address, phone, GSTIN badge
- Customer details + invoice number + date
- Items table with HSN, qty, unit, rate, amount
- GST breakdown + total
- Amount in words
- Bank payment details
- Social media footer

### Quotation (A4)
- Dark header with shop details
- Client info + reference number
- Products table (qty, rate, total)
- Total + GST breakdown
- Amount in words
- Payment information (bank details)
- Contact info + authorised signatory
- Notes: "1. Transportation charges extra. 2. Installation not included."
- Social media footer

---

## WhatsApp Sharing Flow
1. The print dialog opens for the PDF
2. User saves/prints the PDF
3. WhatsApp opens with the customer's number pre-filled with a message
4. User attaches the saved PDF and sends

---

## Shop Details (Pre-configured)
- **Name:** Jeduthun Musicals
- **Address:** 314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu
- **Phone:** 04637-213875 | +91 8838858275
- **GSTIN:** 33KVOPS8216M1ZM

(All configurable via Settings page)

---

## Tech Stack
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React (CRA), React Router v6, Tailwind CSS, Axios
- **Fonts:** Playfair Display + Nunito
- **Theme:** Black (#1a1a1a) & Gold (#D4AF37)
