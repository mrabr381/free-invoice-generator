const test = require('node:test');
const assert = require('node:assert/strict');
const { lineTotal, subtotal, taxAmount, grandTotal, calculate, docLabel, formatMoney, isValidItem } = require('../invoice.js');

const SAMPLE = [
  { description: 'Logo design', hours: 6, rate: 45 },
  { description: 'Website homepage build', hours: 10, rate: 50 },
  { description: 'Revisions', hours: 2, rate: 40 },
];

test('line totals: 6h x £45 = £270, 10h x £50 = £500, 2h x £40 = £80', () => {
  assert.equal(lineTotal(SAMPLE[0]), 270);
  assert.equal(lineTotal(SAMPLE[1]), 500);
  assert.equal(lineTotal(SAMPLE[2]), 80);
});

test('subtotal of the sample invoice is £850', () => {
  assert.equal(subtotal(SAMPLE), 850);
});

test('tax/VAT: 20% of £850 is £170', () => {
  assert.equal(taxAmount(850, 20), 170);
  assert.equal(taxAmount(850, 0), 0);
  assert.equal(taxAmount(100, 5), 5);
});

test('grand total: £850 + £170 tax - £0 discount = £1,020', () => {
  assert.equal(grandTotal(850, 170, 0), 1020);
  assert.equal(grandTotal(850, 170, 20), 1000);
});

test('calculate() returns the full breakdown for the sample invoice', () => {
  assert.deepEqual(calculate(SAMPLE, 20, 0), { subtotal: 850, tax: 170, discount: 0, total: 1020 });
});

test('empty items total £0, not NaN', () => {
  assert.deepEqual(calculate([], 20, 0), { subtotal: 0, tax: 0, discount: 0, total: 0 });
});

test('fractional hours round to 2 decimals (2.5h x £33.33 = £83.33)', () => {
  assert.equal(lineTotal({ hours: 2.5, rate: 33.33 }), 83.33);
});

test('quote vs invoice labelling', () => {
  assert.equal(docLabel('quote'), 'QUOTE');
  assert.equal(docLabel('invoice'), 'INVOICE');
  assert.equal(docLabel(''), 'INVOICE');
});

test('money formatting uses the right currency symbol', () => {
  assert.equal(formatMoney(1020, 'GBP'), '£1020.00');
  assert.equal(formatMoney(1020, 'USD'), '$1020.00');
  assert.equal(formatMoney(1020, 'EUR'), '€1020.00');
});

test('item validation rejects blank description or zero hours', () => {
  assert.equal(isValidItem(SAMPLE[0]), true);
  assert.equal(isValidItem({ description: '', hours: 1, rate: 10 }), false);
  assert.equal(isValidItem({ description: 'Work', hours: 0, rate: 10 }), false);
});
