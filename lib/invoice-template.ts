import type { InvoiceData } from "./invoice"
import { formatAED } from "./money"

export function renderBilingualInvoiceHtml(data: InvoiceData, autoPrint = false): string {
  const isCod = data.paymentMethod === "cod"
  const paymentMethodLabelEn = isCod ? "Cash on Delivery (COD)" : "Online Card (Stripe)"
  const paymentMethodLabelAr = isCod ? "الدفع عند الاستلام" : "بطاقة مصرفية إلكترونية"

  const paymentStatusLabelEn = data.paymentStatus === "paid" ? "PAID" : "CONFIRMED"
  const paymentStatusLabelAr = data.paymentStatus === "paid" ? "مدفوعة" : "مؤكدة"

  const fullAddressEn = [
    data.customer.address.apartment && `Apt: ${data.customer.address.apartment}`,
    data.customer.address.building && `Bldg: ${data.customer.address.building}`,
    data.customer.address.street,
    data.customer.address.area,
    `${data.customer.address.emirate}, ${data.customer.address.country}`,
  ]
    .filter(Boolean)
    .join(", ")

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice ${data.invoiceNumber} - AR Boutique</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f7f6f2;
      color: #111111;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 24px 16px;
    }

    .ar-text {
      font-family: 'Amiri', 'Traditional Arabic', serif;
      direction: rtl;
      unicode-bidi: embed;
    }

    .toolbar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1c1917;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .toolbar-title {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.05em;
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 2px;
    }

    .btn-primary {
      background: #ffffff;
      color: #111111;
    }
    .btn-primary:hover {
      background: #e7e5e4;
    }

    .btn-secondary {
      background: transparent;
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    /* A4 Invoice Container */
    .invoice-sheet {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 44px 48px;
      border: 1px solid #e7e4dc;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
      position: relative;
    }

    /* Header Masthead */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1c1917;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }

    .brand-col h1 {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: #111111;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .brand-ar-title {
      font-size: 15px;
      font-weight: 700;
      color: #44403c;
      margin-bottom: 10px;
    }

    .supplier-meta {
      font-size: 10.5px;
      color: #57534e;
      line-height: 1.6;
    }

    .trn-badge {
      display: inline-block;
      margin-top: 6px;
      background: #f5f4ef;
      border: 1px solid #e7e5e4;
      padding: 3px 8px;
      font-weight: 600;
      color: #1c1917;
      letter-spacing: 0.05em;
    }

    .invoice-title-col {
      text-align: right;
    }

    .doc-type-en {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #111111;
      text-transform: uppercase;
    }

    .doc-type-ar {
      font-size: 20px;
      font-weight: 700;
      color: #111111;
      margin-bottom: 8px;
    }

    .doc-number-box {
      margin-top: 6px;
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      padding: 8px 12px;
      text-align: right;
    }

    .doc-number {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #1c1917;
    }

    .doc-meta-row {
      font-size: 10.5px;
      color: #57534e;
      margin-top: 3px;
    }

    /* Billing & Order Context Grid */
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
      background: #fbfbfa;
      border: 1px solid #eae7e1;
      padding: 16px 20px;
    }

    .party-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #78716c;
      text-transform: uppercase;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }

    .party-name {
      font-size: 13px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 4px;
    }

    .party-line {
      font-size: 11px;
      color: #44403c;
      line-height: 1.5;
    }

    /* Items Table */
    .table-container {
      margin-bottom: 24px;
    }

    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    table.invoice-table th {
      background: #f5f4f0;
      border-top: 1px solid #1c1917;
      border-bottom: 1px solid #1c1917;
      padding: 9px 8px;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #1c1917;
      vertical-align: middle;
    }

    table.invoice-table th .th-ar {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #57534e;
      margin-top: 1px;
    }

    table.invoice-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #eae7e1;
      font-size: 10.5px;
      color: #292524;
      vertical-align: top;
    }

    .col-num { width: 5%; text-align: center; }
    .col-desc { width: 38%; }
    .col-qty { width: 7%; text-align: center; }
    .col-unit { width: 13%; text-align: right; }
    .col-net { width: 12%; text-align: right; }
    .col-vat { width: 11%; text-align: right; }
    .col-gross { width: 14%; text-align: right; font-weight: 600; }

    .item-title {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 13px;
      font-weight: 600;
      color: #111;
      margin-bottom: 2px;
    }

    .item-specs {
      font-size: 10px;
      color: #57534e;
    }

    .item-sku {
      font-size: 9.5px;
      font-family: monospace;
      color: #78716c;
      margin-top: 2px;
    }

    /* Summary & Totals */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }

    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 6px 8px;
      font-size: 11px;
      color: #44403c;
    }

    .totals-table td.label-col {
      text-align: left;
    }

    .totals-table td.val-col {
      text-align: right;
      font-family: 'Montserrat', sans-serif;
      font-weight: 500;
      color: #111;
    }

    .totals-table tr.total-row td {
      border-top: 2px solid #1c1917;
      border-bottom: 2px solid #1c1917;
      font-size: 13px;
      font-weight: 700;
      color: #111111;
      padding: 10px 8px;
    }

    .totals-table tr.total-row td .val-ar {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #57534e;
    }

    /* Tax Compliance Statement */
    .compliance-footer {
      border-top: 1px solid #eae7e1;
      padding-top: 18px;
      margin-top: 20px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      align-items: center;
    }

    .compliance-text-en {
      font-size: 9.5px;
      color: #78716c;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .compliance-text-ar {
      font-size: 11px;
      color: #78716c;
      line-height: 1.5;
    }

    .signature-box {
      border: 1px dashed #d6d3cb;
      padding: 12px;
      text-align: center;
      background: #fafaf8;
    }

    .signature-title {
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #57534e;
      margin-bottom: 20px;
    }

    .signature-line {
      border-top: 1px solid #78716c;
      font-size: 9px;
      color: #78716c;
      padding-top: 4px;
    }

    /* Print Optimization Rules */
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .invoice-sheet {
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
        margin: 0;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
    }
  </style>
</head>
<body>

  <!-- Top Action Toolbar (Hidden in Print) -->
  <div class="toolbar no-print">
    <div class="toolbar-title">
      Tax Invoice • <strong>${data.invoiceNumber}</strong>
    </div>
    <div class="toolbar-actions">
      <button onclick="window.print()" class="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print / Save PDF
      </button>
      <button onclick="window.close()" class="btn btn-secondary">
        Close
      </button>
    </div>
  </div>

  <!-- A4 Printable Sheet -->
  <main class="invoice-sheet">

    <!-- Header -->
    <header class="invoice-header">
      <div class="brand-col">
        <h1>${data.supplier.nameEn}</h1>
        <div class="brand-ar-title ar-text">${data.supplier.nameAr}</div>
        <div class="supplier-meta">
          <div>${data.supplier.addressEn}</div>
          <div class="ar-text">${data.supplier.addressAr}</div>
          <div>Email: ${data.supplier.email} | Tel: ${data.supplier.phone}</div>
          <div class="trn-badge">
            TRN / الرقم الضريبي: <strong>${data.supplier.trn}</strong>
          </div>
        </div>
      </div>

      <div class="invoice-title-col">
        <div class="doc-type-en">TAX INVOICE</div>
        <div class="doc-type-ar ar-text">فاتورة ضريبية</div>
        <div class="doc-number-box">
          <div class="doc-number">${data.invoiceNumber}</div>
          <div class="doc-meta-row">
            Date / التاريخ: <strong>${data.issuedAt}</strong>
          </div>
          <div class="doc-meta-row">
            Order Ref / مرجع الطلب: <strong>#${data.orderNumber}</strong>
          </div>
          <div class="doc-meta-row">
            Status / الحالة: <strong>${paymentStatusLabelEn} / ${paymentStatusLabelAr}</strong>
          </div>
        </div>
      </div>
    </header>

    <!-- Billed To & Payment Meta -->
    <section class="party-grid">
      <div>
        <div class="party-title">
          <span>BILLED TO</span>
          <span class="ar-text">فاتورة إلى</span>
        </div>
        <div class="party-name">${data.customer.name}</div>
        <div class="party-line">${fullAddressEn}</div>
        <div class="party-line">Phone / الهاتف: ${data.customer.phone || "N/A"}</div>
        <div class="party-line">Email / البريد: ${data.customer.email || "N/A"}</div>
      </div>

      <div>
        <div class="party-title">
          <span>PAYMENT & FULFILMENT</span>
          <span class="ar-text">تفاصيل الدفع والتسليم</span>
        </div>
        <div class="party-line">
          Method / الطريقة: <strong>${paymentMethodLabelEn}</strong>
        </div>
        <div class="party-line ar-text" style="color: #57534e;">
          ${paymentMethodLabelAr}
        </div>
        <div class="party-line" style="margin-top: 4px;">
          Order Date / تاريخ الطلب: ${data.orderDate}
        </div>
        <div class="party-line">
          Currency / العملة: <strong>AED (UAE Dirhams / درهم إماراتي)</strong>
        </div>
      </div>
    </section>

    <!-- Line Items Table -->
    <section class="table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th class="col-num">#<span class="th-ar">م</span></th>
            <th class="col-desc">Description<span class="th-ar">البيان والوصف</span></th>
            <th class="col-qty">Qty<span class="th-ar">الكمية</span></th>
            <th class="col-unit">Unit Price (Excl.)<span class="th-ar">سعر الوحدة (غير شامل)</span></th>
            <th class="col-net">Net Amount<span class="th-ar">المبلغ الصافي</span></th>
            <th class="col-vat">VAT (${data.vatRatePct}%)<span class="th-ar">الضريبة</span></th>
            <th class="col-gross">Total (AED)<span class="th-ar">الإجمالي شامل الضريبة</span></th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (it, index) => `
          <tr>
            <td class="col-num">${index + 1}</td>
            <td class="col-desc">
              <div class="item-title">${it.productName}</div>
              <div class="item-specs">
                Colour: <strong>${it.colourName}</strong>${it.sizeLabel ? ` • Size: <strong>${it.sizeLabel}</strong>` : ""}
              </div>
              ${it.sku ? `<div class="item-sku">SKU: ${it.sku}</div>` : ""}
            </td>
            <td class="col-qty">${it.quantity}</td>
            <td class="col-unit">${formatAED(it.unitPriceNetFils).replace("AED ", "")}</td>
            <td class="col-net">${formatAED(it.totalNetFils).replace("AED ", "")}</td>
            <td class="col-vat">${formatAED(it.vatFils).replace("AED ", "")}</td>
            <td class="col-gross">${formatAED(it.totalGrossFils).replace("AED ", "")}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <!-- Financial Totals -->
    <section class="summary-section">
      <table class="totals-table">
        <tr>
          <td class="label-col">
            Subtotal (Excl. VAT)
            <div class="ar-text" style="font-size: 10px; color: #78716c;">المجموع الفرعي (غير شامل)</div>
          </td>
          <td class="val-col">${formatAED(data.subtotalNetFils)}</td>
        </tr>
        <tr>
          <td class="label-col">
            Delivery Fee
            <div class="ar-text" style="font-size: 10px; color: #78716c;">رسوم التوصيل</div>
          </td>
          <td class="val-col">
            ${data.deliveryFeeFils === 0 ? "Complimentary" : formatAED(data.deliveryFeeFils)}
          </td>
        </tr>
        <tr>
          <td class="label-col">
            UAE VAT (${data.vatRatePct}%)
            <div class="ar-text" style="font-size: 10px; color: #78716c;">ضريبة القيمة المضافة (٥٪)</div>
          </td>
          <td class="val-col">${formatAED(data.totalVatFils)}</td>
        </tr>
        <tr class="total-row">
          <td class="label-col">
            TOTAL AMOUNT (AED)
            <span class="val-ar ar-text">المبلغ الإجمالي المستحق</span>
          </td>
          <td class="val-col" style="font-size: 15px;">
            ${formatAED(data.totalGrossFils)}
          </td>
        </tr>
      </table>
    </section>

    <!-- FTA Legal Compliance & Seal -->
    <footer class="compliance-footer">
      <div>
        <p class="compliance-text-en">
          This document is an official Tax Invoice issued in accordance with UAE Federal Decree-Law No. (8) of 2017 on Value Added Tax. All prices are in UAE Dirhams (AED) and include 5% standard Value Added Tax.
        </p>
        <p class="compliance-text-ar ar-text">
          هذا المستند هو فاتورة ضريبية رسمية صادرة وفقاً للمرسوم بقانون اتحادي رقم (8) لسنة 2017 في شأن ضريبة القيمة المضافة ولائحته التنفيذية. جميع الأسعار بالدرهم الإماراتي وتشمل 5٪ ضريبة القيمة المضافة.
        </p>
      </div>

      <div class="signature-box">
        <div class="signature-title">
          <span>ATELIER AUTHENTICATION</span>
          <div class="ar-text" style="font-size: 10px; font-weight: normal; margin-top: 1px;">الاعتماد والتوقيع</div>
        </div>
        <div style="font-family: 'Newsreader', serif; font-style: italic; font-size: 14px; margin-bottom: 6px;">
          AR Boutique
        </div>
        <div class="signature-line">Authorized Signatory / التوقيع المعتمد</div>
      </div>
    </footer>

  </main>

  ${
    autoPrint
      ? `<script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>`
      : ""
  }
</body>
</html>`
}
