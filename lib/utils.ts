import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
} 

// Barcode helpers (EAN-13/UPC-A)
export function computeGtinCheckDigit(gtinWithoutCheck: string): string {
  const digits = gtinWithoutCheck.replace(/\D/g, '').split('').map(n => parseInt(n, 10));
  let sum = 0;
  for (let i = digits.length - 1, pos = 1; i >= 0; i--, pos++) {
    sum += digits[i] * (pos % 2 === 1 ? 3 : 1);
  }
  const mod = sum % 10;
  return mod === 0 ? '0' : String(10 - mod);
}

export function normalizeToEan13(input: string): { ean13: string | null; format: 'UPC_A' | 'EAN_13' | 'UNKNOWN'; valid: boolean } {
  const code = (input || '').replace(/\D/g, '');
  if (code.length === 12) {
    // UPC-A → EAN-13 by prepending 0 and recomputing check digit
    const body = '0' + code.slice(0, 11);
    const check = computeGtinCheckDigit(body);
    return { ean13: body + check, format: 'UPC_A', valid: true };
  }
  if (code.length === 13) {
    const body = code.slice(0, 12);
    const expected = computeGtinCheckDigit(body);
    const ok = expected === code.slice(12);
    return { ean13: ok ? code : body + expected, format: 'EAN_13', valid: ok };
  }
  return { ean13: null, format: 'UNKNOWN', valid: false };
}