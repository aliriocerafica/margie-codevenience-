export type ReceiptItem = {
    name: string;
    barcode?: string;
    price: number | string;
    quantity: number;
};

export type ReceiptPayload = {
    storeName: string;
    storePhone?: string;
    storeAddressLines?: string[];
    logoPath?: string; // public path e.g. /Logo.png
    items: ReceiptItem[];
    subtotal: number;
    discount: number;
    taxAmount: number;
    total: number;
    paidAmount?: number;
    change?: number;
    timestamp?: Date;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const buildReceiptHtml = (data: ReceiptPayload) => {
    const ts = data.timestamp ?? new Date();
    const date = ts.toLocaleDateString();
    const time = ts.toLocaleTimeString();
    const itemsSold = data.items.reduce((s, i) => s + i.quantity, 0);

    const rows = data.items.map((i) => {
        const unit = typeof i.price === 'string' ? parseFloat(i.price) : i.price;
        const lineTotal = unit * i.quantity;
        return `
        <tr>
            <td class="desc">
                <div class="name">${i.name}</div>
                ${i.barcode ? `<div class="code">${i.barcode}</div>` : ''}
            </td>
            <td class="qty">${i.quantity}</td>
            <td class="price">${formatCurrency(unit)}</td>
            <td class="total">${formatCurrency(lineTotal)}</td>
        </tr>`;
    }).join('\n');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Receipt</title>
<style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; margin: 0; }
    .receipt { width: 320px; margin: 0 auto; padding: 16px; }
    .header { text-align: center; }
    .logo { height: 48px; margin: 6px auto 8px; display: block; object-fit: contain; }
    h1 { font-size: 14px; margin: 4px 0; }
    .muted { color: #666; font-size: 11px; line-height: 1.2; }
    hr { border: none; border-top: 1px dashed #bbb; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 4px 0; color: #555; font-size: 10px; }
    td { padding: 4px 0; vertical-align: top; }
    td.qty, td.price, td.total { text-align: right; white-space: nowrap; }
    .desc .name { font-weight: 600; }
    .desc .code { font-size: 10px; color: #777; }
    .totals { font-size: 12px; }
    .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
    .totals .em { font-weight: 700; }
    .footer { text-align: center; margin-top: 8px; }
    .small { font-size: 10px; color: #666; }
    @media print { body { background: #fff; } .receipt { box-shadow: none; } }
</style>
</head>
<body onload="setTimeout(() => { window.print(); }, 100);">
    <div class="receipt">
        <div class="header">
            ${data.logoPath ? `<img class="logo" src="${data.logoPath}" alt="logo" />` : ''}
            <h1>${data.storeName}</h1>
            ${data.storePhone ? `<div class="muted">${data.storePhone}</div>` : ''}
            ${data.storeAddressLines?.length ? `<div class="muted">${data.storeAddressLines.join('<br/>')}</div>` : ''}
        </div>

        <hr />

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="qty">Qty</th>
                    <th class="price">Price</th>
                    <th class="total">Total</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <hr />

        <div class="totals">
            <div class="row"><span>Subtotal</span><span>${formatCurrency(data.subtotal)}</span></div>
            <div class="row"><span>Discount</span><span>- ${formatCurrency(data.discount)}</span></div>
            <div class="row"><span>Tax</span><span>${formatCurrency(data.taxAmount)}</span></div>
            <div class="row em"><span>Total</span><span>${formatCurrency(data.total)}</span></div>
        </div>

        <hr />

        <div class="footer">
            <div class="small"># ITEMS SOLD ${itemsSold}</div>
            <div class="small">${date} ${time}</div>
        </div>
    </div>
</body>
</html>`;
};

export const printReceipt = (payload: ReceiptPayload) => {
    const html = buildReceiptHtml(payload);
    const printWindow = window.open('', 'PRINT', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
};


