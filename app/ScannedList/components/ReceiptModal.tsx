"use client";

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Printer } from "lucide-react";

export type ReceiptModalProps = {
    isOpen: boolean;
    onClose: () => void;
    receiptData: {
        storeName: string;
        storePhone?: string;
        storeAddressLines?: string[];
        logoPath?: string;
        items: Array<{
            name: string;
            barcode?: string;
            price: number | string;
            quantity: number;
        }>;
        subtotal: number;
        discount?: number;
        total: number;
        amountReceived?: number;
        change?: number;
        timestamp?: Date;
        transactionNo?: string;
    };
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!doctype html>
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
                        ${receiptData.logoPath ? `<img class="logo" src="${receiptData.logoPath}" alt="logo" />` : ''}
                        <h1>${receiptData.storeName}</h1>
                        <div class="title">Official Receipt</div>
                        ${receiptData.storePhone ? `<div class="muted">${receiptData.storePhone}</div>` : ''}
                        ${receiptData.storeAddressLines?.length ? `<div class="muted">${receiptData.storeAddressLines.join('<br/>')}</div>` : ''}
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
                            ${receiptData.items.map((i) => {
                                const unit = typeof i.price === "string" ? parseFloat(i.price) : i.price;
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
                            }).join('\n')}
                        </tbody>
                    </table>

                    <hr />

                    <div class="totals">
                        <div class="row"><span>Subtotal</span><span>${formatCurrency(receiptData.subtotal)}</span></div>
                        ${receiptData.discount && receiptData.discount > 0 ? `<div class="row"><span>Discount</span><span>-${formatCurrency(receiptData.discount)}</span></div>` : ''}
                        <div class="sep"></div>
                        <div class="row em"><span>Total</span><span>${formatCurrency(receiptData.total)}</span></div>
                    </div>
                    ${receiptData.amountReceived && receiptData.amountReceived > 0 ? `
                    <div class="payment">
                        <div class="row"><span>Amount Received</span><span>${formatCurrency(receiptData.amountReceived)}</span></div>
                        ${receiptData.change !== undefined && receiptData.change >= 0 ? `<div class="row"><span>Change</span><span>${formatCurrency(receiptData.change)}</span></div>` : ''}
                    </div>` : ''}

                    <hr />

                    <div class="footer">
                        ${receiptData.transactionNo ? `<div class="small">Transaction No: ${receiptData.transactionNo}</div>` : ''}
                        <div class="small"># ITEMS SOLD ${receiptData.items.reduce((s, i) => s + i.quantity, 0)}</div>
                        <div class="small">${receiptData.timestamp ? receiptData.timestamp.toLocaleDateString() + ' ' + receiptData.timestamp.toLocaleTimeString() : new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()}</div>
                        <div class="thanks">Thank you for your purchase!</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const itemsSold = receiptData.items.reduce((s, i) => s + i.quantity, 0);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                body: "py-6",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">Receipt</h3>
                </ModalHeader>
                <ModalBody>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                        <div className="text-center mb-4">
                            {receiptData.logoPath && (
                                <img 
                                    src={receiptData.logoPath} 
                                    alt="logo" 
                                    className="h-12 mx-auto mb-2 object-contain"
                                />
                            )}
                            <h1 className="text-sm font-bold text-gray-900">{receiptData.storeName}</h1>
                            <div className="text-xs font-bold text-gray-800 mb-1">Official Receipt</div>
                            {receiptData.storePhone && (
                                <div className="text-xs text-gray-700">{receiptData.storePhone}</div>
                            )}
                            {receiptData.storeAddressLines?.length && (
                                <div className="text-xs text-gray-700">
                                    {receiptData.storeAddressLines.join(', ')}
                                </div>
                            )}
                        </div>

                        <hr className="border-dashed border-gray-300 my-2" />

                        <div className="text-xs">
                            <div className="grid grid-cols-4 gap-2 font-semibold border-b border-dashed border-gray-300 pb-1 mb-2 text-gray-900">
                                <div>Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                                <div className="text-right">Total</div>
                            </div>
                            
                            {receiptData.items.map((item, idx) => {
                                const unit = typeof item.price === "string" ? parseFloat(item.price) : item.price;
                                const lineTotal = unit * item.quantity;
                                return (
                                    <div key={idx} className="grid grid-cols-4 gap-2 py-1 text-gray-900">
                                        <div>
                                            <div className="font-semibold">{item.name}</div>
                                            {item.barcode && (
                                                <div className="text-gray-600 text-xs">{item.barcode}</div>
                                            )}
                                        </div>
                                        <div className="text-right">{item.quantity}</div>
                                        <div className="text-right">{formatCurrency(unit)}</div>
                                        <div className="text-right">{formatCurrency(lineTotal)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <hr className="border-dashed border-gray-300 my-2" />

                        <div className="text-xs space-y-1 text-gray-900">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(receiptData.subtotal)}</span>
                            </div>
                            {receiptData.discount && receiptData.discount > 0 && (
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span className="text-red-600 dark:text-red-400">-{formatCurrency(receiptData.discount)}</span>
                                </div>
                            )}
                            <hr className="border-dashed border-gray-300 my-1" />
                            <div className="flex justify-between font-bold text-sm">
                                <span>Total</span>
                                <span>{formatCurrency(receiptData.total)}</span>
                            </div>
                            {receiptData.amountReceived && receiptData.amountReceived > 0 && (
                                <>
                                    <hr className="border-dashed border-gray-300 my-1" />
                                    <div className="flex justify-between">
                                        <span>Amount Received</span>
                                        <span>{formatCurrency(receiptData.amountReceived)}</span>
                                    </div>
                                    {receiptData.change !== undefined && receiptData.change >= 0 && (
                                        <div className="flex justify-between">
                                            <span>Change</span>
                                            <span>{formatCurrency(receiptData.change)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <hr className="border-dashed border-gray-300 my-2" />

                        <div className="text-center text-xs text-gray-700">
                            {receiptData.transactionNo && (
                                <div>Transaction No: {receiptData.transactionNo}</div>
                            )}
                            <div># ITEMS SOLD {itemsSold}</div>
                            <div>
                                {receiptData.timestamp 
                                    ? receiptData.timestamp.toLocaleDateString() + ' ' + receiptData.timestamp.toLocaleTimeString()
                                    : new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
                                }
                            </div>
                            <div className="font-semibold mt-1 text-gray-900">Thank you for your purchase!</div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="light"
                        onPress={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        color="primary"
                        startContent={<Printer className="h-4 w-4" />}
                        onPress={handlePrint}
                    >
                        Print Receipt
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
