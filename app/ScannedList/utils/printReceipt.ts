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
    const showDiscount = (data.discount ?? 0) > 0;
    const showPaid = typeof data.paidAmount === 'number';
    const showChange = typeof data.change === 'number';

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
    .logo { height: 48px; margin: 6px auto 6px; display: block; object-fit: contain; }
    h1 { font-size: 14px; margin: 2px 0; }
    .title { font-size: 12px; margin: 2px 0 6px; color: #111; font-weight: 700; letter-spacing: 0.4px; }
    .muted { color: #666; font-size: 11px; line-height: 1.2; }
    hr { border: none; border-top: 1px dashed #bbb; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
    thead th { text-align: left; padding: 4px 4px 4px 0; color: #444; font-size: 10px; border-bottom: 1px dashed #bbb; }
    thead th:first-child { width: 40%; }
    thead th.qty { width: 15%; text-align: right; }
    thead th.price { width: 22%; text-align: right; }
    thead th.total { width: 23%; text-align: right; }
    td { padding: 4px 4px 4px 0; vertical-align: top; }
    td.desc { width: 40%; }
    td.qty { width: 15%; text-align: right; white-space: nowrap; padding-right: 8px; }
    td.price { width: 22%; text-align: right; white-space: nowrap; padding-right: 8px; }
    td.total { width: 23%; text-align: right; white-space: nowrap; }
    .desc .name { font-weight: 600; }
    .desc .code { font-size: 10px; color: #777; }
    .totals { font-size: 12px; margin-top: 4px; }
    .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
    .totals .sep { border-top: 1px dashed #bbb; margin: 6px 0; }
    .totals .em { font-weight: 800; font-size: 13px; }
    .payment { font-size: 12px; margin-top: 4px; }
    .payment .row { display: flex; justify-content: space-between; padding: 2px 0; }
    .footer { text-align: center; margin-top: 10px; }
    .small { font-size: 10px; color: #666; }
    .thanks { margin-top: 6px; font-size: 11px; font-weight: 600; }
    @media print { body { background: #fff; } .receipt { box-shadow: none; } }
</style>
</head>
<body onload="setTimeout(() => { window.print(); }, 100);">
    <div class="receipt">
        <div class="header">
            ${data.logoPath ? `<img class="logo" src="${data.logoPath}" alt="logo" />` : ''}
            <h1>${data.storeName}</h1>
            <div class="title">Official Receipt</div>
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
            ${showDiscount ? `<div class="row"><span>Discount</span><span>- ${formatCurrency(data.discount)}</span></div>` : ''}
            
            <div class="sep"></div>
            <div class="row em"><span>Total</span><span>${formatCurrency(data.total)}</span></div>
        </div>

        ${showPaid || showChange ? `
        <div class="payment">
            ${showPaid ? `<div class="row"><span>Cash</span><span>${formatCurrency(data.paidAmount as number)}</span></div>` : ''}
            ${showChange ? `<div class="row"><span>Change</span><span>${formatCurrency(data.change as number)}</span></div>` : ''}
        </div>` : ''}

        <hr />

        <div class="footer">
            <div class="small"># ITEMS SOLD ${itemsSold}</div>
            <div class="small">${date} ${time}</div>
            <div class="thanks">Thank you for your purchase!</div>
        </div>
    </div>
</body>
</html>`;
};

export const printReceipt = async (payload: ReceiptPayload): Promise<void> => {
    const html = buildReceiptHtml(payload);
    const popupWidth = 400;
    const popupHeight = 600;
    const left = Math.max(0, Math.floor((window.screen.width - popupWidth) / 2));
    const top = Math.max(0, Math.floor((window.screen.height - popupHeight) / 2));
    const features = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`; 
    const printWindow = window.open('', 'PRINT', features);
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait until the print window is closed by the user, then resolve
    await new Promise<void>((resolve) => {
        const timer = window.setInterval(() => {
            if (printWindow.closed) {
                window.clearInterval(timer);
                resolve();
            }
        }, 300);
    });
};


