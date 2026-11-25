// Pure invoice maths — no DOM, no storage. Shared by the browser and the tests.
'use strict';

function round2(n) {
  // +1e-9 guards binary float error: 2.5 * 33.33 is stored as 83.32499…,
  // which Math.round would wrongly drop to 83.32 instead of 83.33.
  return Math.round(((Number(n) || 0) + 1e-9) * 100) / 100;
}

function lineTotal(item) {
  const hours = Number(item && item.hours) || 0;
  const rate = Number(item && item.rate) || 0;
  return round2(hours * rate);
}

function subtotal(items) {
  return round2((items || []).reduce((sum, it) => sum + lineTotal(it), 0));
}

function taxAmount(sub, taxRate) {
  return round2(sub * ((Number(taxRate) || 0) / 100));
}

function grandTotal(sub, tax, discount) {
  return round2(sub + tax - (Number(discount) || 0));
}

// Full totals object for one invoice/quote.
function calculate(items, taxRate, discount) {
  const sub = subtotal(items);
  const tax = taxAmount(sub, taxRate);
  const total = grandTotal(sub, tax, discount);
  return { subtotal: sub, tax, discount: round2(discount), total };
}

function docLabel(mode) {
  return String(mode || '').toLowerCase() === 'quote' ? 'QUOTE' : 'INVOICE';
}

function formatMoney(amount, currency) {
  const symbols = { GBP: '£', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || '£';
  return symbol + (Number(amount) || 0).toFixed(2);
}

function isValidItem(item) {
  return !!(item && String(item.description || '').trim()
    && Number(item.hours) > 0 && Number(item.rate) >= 0);
}

// Export for Node tests; in the browser these land on window.InvoiceMath.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { round2, lineTotal, subtotal, taxAmount, grandTotal, calculate, docLabel, formatMoney, isValidItem };
} else if (typeof window !== 'undefined') {
  window.InvoiceMath = { round2, lineTotal, subtotal, taxAmount, grandTotal, calculate, docLabel, formatMoney, isValidItem };
}
