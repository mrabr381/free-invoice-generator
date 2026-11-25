// Browser UI for the Free Invoice Generator.
// All maths lives in invoice.js (window.InvoiceMath). Storage is localStorage only.
(function () {
  'use strict';
  var M = window.InvoiceMath;
  var KEY = 'fig_invoices_v1';
  var mode = 'invoice';

  var SAMPLE_ITEMS = [
    { description: 'Logo design', hours: 6, rate: 45 },
    { description: 'Website homepage build', hours: 10, rate: 50 },
    { description: 'Revisions', hours: 2, rate: 40 }
  ];

  function $(id) { return document.getElementById(id); }
  function val(id) { return $(id).value; }

  function itemRows() {
    return Array.prototype.slice.call(document.querySelectorAll('#items .item-row'));
  }

  function readItems() {
    return itemRows().map(function (row) {
      return {
        description: row.querySelector('.it-desc').value,
        hours: parseFloat(row.querySelector('.it-hours').value) || 0,
        rate: parseFloat(row.querySelector('.it-rate').value) || 0
      };
    });
  }

  function addItemRow(item) {
    item = item || { description: '', hours: '', rate: '' };
    var div = document.createElement('div');
    div.className = 'item-row row3';
    div.innerHTML =
      '<div><input class="it-desc" placeholder="Description" value=""></div>' +
      '<div><input class="it-hours" type="number" min="0" step="0.25" placeholder="Hours" value=""></div>' +
      '<div><input class="it-rate" type="number" min="0" step="0.01" placeholder="Rate" value=""></div>' +
      '<div><button type="button" class="btn-danger it-remove" aria-label="Remove line">✕</button></div>';
    div.querySelector('.it-desc').value = item.description || '';
    div.querySelector('.it-hours').value = item.hours === '' ? '' : item.hours;
    div.querySelector('.it-rate').value = item.rate === '' ? '' : item.rate;
    div.querySelector('.it-remove').addEventListener('click', function () { div.remove(); render(); });
    div.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', render); });
    $('items').appendChild(div);
  }

  function render() {
    var items = readItems();
    var totals = M.calculate(items, parseFloat(val('tax-rate')) || 0, parseFloat(val('discount')) || 0);
    var currency = val('currency');
    $('pv-label').textContent = M.docLabel(mode);
    $('pv-business').textContent = val('business');
    $('pv-business-address').textContent = val('business-address');
    $('pv-client').textContent = val('client');
    $('pv-client-address').textContent = val('client-address');
    $('pv-doc-no').textContent = val('doc-no');
    $('pv-date').textContent = val('doc-date');
    $('pv-due').textContent = val('due-date');
    $('pv-notes').textContent = val('notes');
    $('pv-tax-rate').textContent = val('tax-rate') || '0';
    $('pv-subtotal').textContent = M.formatMoney(totals.subtotal, currency);
    $('pv-tax').textContent = M.formatMoney(totals.tax, currency);
    $('pv-discount').textContent = M.formatMoney(totals.discount, currency);
    $('pv-total').textContent = M.formatMoney(totals.total, currency);
    $('pv-items').innerHTML = items.map(function (it) {
      return '<tr><td>' + escapeHtml(it.description || '—') + '</td>' +
        '<td class="num">' + (it.hours || 0) + '</td>' +
        '<td class="num">' + M.formatMoney(it.rate, currency) + '</td>' +
        '<td class="num">' + M.formatMoney(M.lineTotal(it), currency) + '</td></tr>';
    }).join('');
    document.title = M.docLabel(mode).charAt(0) + M.docLabel(mode).slice(1).toLowerCase() + ' ' + val('doc-no') + ' — Free Invoice Generator';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function collectDoc() {
    return {
      mode: mode, business: val('business'), businessAddress: val('business-address'),
      client: val('client'), clientAddress: val('client-address'), docNo: val('doc-no'),
      date: val('doc-date'), dueDate: val('due-date'), currency: val('currency'),
      taxRate: parseFloat(val('tax-rate')) || 0, discount: parseFloat(val('discount')) || 0,
      notes: val('notes'), items: readItems(), savedAt: new Date().toISOString()
    };
  }

  function loadDoc(doc) {
    mode = doc.mode === 'quote' ? 'quote' : 'invoice';
    setModeButtons();
    $('business').value = doc.business || '';
    $('business-address').value = doc.businessAddress || '';
    $('client').value = doc.client || '';
    $('client-address').value = doc.clientAddress || '';
    $('doc-no').value = doc.docNo || '';
    $('doc-date').value = doc.date || '';
    $('due-date').value = doc.dueDate || '';
    $('currency').value = doc.currency || 'GBP';
    $('tax-rate').value = doc.taxRate != null ? doc.taxRate : 0;
    $('discount').value = doc.discount != null ? doc.discount : 0;
    $('notes').value = doc.notes || '';
    $('items').innerHTML = '';
    (doc.items && doc.items.length ? doc.items : [{}]).forEach(addItemRow);
    render();
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function writeSaved(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function renderSaved() {
    var list = readSaved();
    var box = $('saved-list');
    if (!list.length) { box.innerHTML = '<p class="hint">No saved invoices yet.</p>'; return; }
    box.innerHTML = '';
    list.forEach(function (doc, i) {
      var totals = M.calculate(doc.items, doc.taxRate, doc.discount);
      var row = document.createElement('div');
      row.className = 'saved-item';
      row.innerHTML = '<span><strong>' + escapeHtml(doc.docNo || '(no number)') + '</strong> — ' +
        escapeHtml(M.docLabel(doc.mode)) + ' for ' + escapeHtml(doc.client || '(no client)') +
        ' · ' + escapeHtml(M.formatMoney(totals.total, doc.currency)) + '</span>';
      var loadBtn = document.createElement('button');
      loadBtn.type = 'button'; loadBtn.className = 'btn-ghost'; loadBtn.textContent = 'Load';
      loadBtn.addEventListener('click', function () { loadDoc(doc); $('status').textContent = 'Loaded ' + doc.docNo + '.'; window.scrollTo(0, 0); });
      var delBtn = document.createElement('button');
      delBtn.type = 'button'; delBtn.className = 'btn-danger'; delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () {
        var next = readSaved(); next.splice(i, 1); writeSaved(next); renderSaved();
        $('status').textContent = 'Deleted ' + (doc.docNo || 'invoice') + '.';
      });
      var btns = document.createElement('span');
      btns.appendChild(loadBtn); btns.appendChild(document.createTextNode(' ')); btns.appendChild(delBtn);
      row.appendChild(btns);
      box.appendChild(row);
    });
  }

  function setModeButtons() {
    $('mode-invoice').classList.toggle('active', mode === 'invoice');
    $('mode-quote').classList.toggle('active', mode === 'quote');
  }

  function resetSample() {
    loadDoc({
      mode: 'invoice', business: 'Northwind Freelance Studio',
      businessAddress: '12 Market Street, London EC1A 1AA',
      client: 'Harbour & Co Ltd', clientAddress: '8 Dock Road, Bristol BS1 4QA',
      docNo: 'INV-2026-001', date: '2026-11-25', dueDate: '2026-12-09',
      currency: 'GBP', taxRate: 20, discount: 0,
      notes: 'Payment within 14 days by bank transfer. Thank you for your business.',
      items: SAMPLE_ITEMS
    });
  }

  // Wire up
  $('mode-invoice').addEventListener('click', function () { mode = 'invoice'; setModeButtons(); render(); });
  $('mode-quote').addEventListener('click', function () { mode = 'quote'; setModeButtons(); render(); });
  $('add-item').addEventListener('click', function () { addItemRow({}); render(); });
  ['business', 'business-address', 'client', 'client-address', 'doc-no', 'doc-date', 'due-date', 'currency', 'tax-rate', 'discount', 'notes']
    .forEach(function (id) { $(id).addEventListener('input', render); });
  $('download-pdf').addEventListener('click', function () { window.print(); });
  $('save-invoice').addEventListener('click', function () {
    var list = readSaved(); list.push(collectDoc()); writeSaved(list); renderSaved();
    $('status').textContent = 'Saved ' + val('doc-no') + ' in this browser.';
  });
  $('reset-sample').addEventListener('click', function () { resetSample(); $('status').textContent = 'Sample data restored.'; });

  resetSample();
  renderSaved();
})();
