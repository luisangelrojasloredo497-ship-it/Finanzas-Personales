'use strict';

const STORAGE_KEY = 'finanzas-personales-v1';

const CATEGORIES = {
  expense: ['Comida', 'Vivienda', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento', 'Educación', 'Ropa', 'Otros'],
  income: ['Salario', 'Freelance', 'Inversiones', 'Regalos', 'Otros ingresos'],
};

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const $ = (sel) => document.querySelector(sel);

let state = load();

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && Array.isArray(data.transactions)) {
      return { transactions: data.transactions, budgets: data.budgets || {} };
    }
  } catch (_) { /* datos corruptos o almacenamiento no disponible */ }
  return { transactions: [], budgets: {} };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    alert('No se pudieron guardar los datos en este navegador.');
  }
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function currentMonth() {
  return $('#month').value;
}

function shiftMonth(delta) {
  const [y, m] = currentMonth().split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  $('#month').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  render();
}

function fillCategorySelect() {
  const type = document.querySelector('input[name="type"]:checked').value;
  $('#category-select').innerHTML = CATEGORIES[type]
    .map((c) => `<option>${escapeHtml(c)}</option>`)
    .join('');
}

function monthTransactions() {
  const month = currentMonth();
  return state.transactions.filter((t) => t.date.startsWith(month));
}

function render() {
  const txs = monthTransactions();
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const total = state.transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

  $('#sum-income').textContent = money.format(income);
  $('#sum-expense').textContent = money.format(expense);
  setSigned($('#sum-balance'), income - expense);
  setSigned($('#sum-total'), total);

  renderTable(txs);
  renderBreakdown(txs);
  renderBudgets();
}

function setSigned(el, value) {
  el.textContent = money.format(value);
  el.className = value < 0 ? 'neg' : 'pos';
}

function renderTable(txs) {
  const q = $('#search').value.trim().toLowerCase();
  const rows = txs
    .filter((t) => !q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  $('#tx-list').innerHTML = rows.map((t) => `
    <tr>
      <td>${t.date.slice(8, 10)}/${t.date.slice(5, 7)}</td>
      <td>${escapeHtml(t.description)}</td>
      <td>${escapeHtml(t.category)}</td>
      <td class="num ${t.type === 'income' ? 'pos' : 'neg'}">${t.type === 'income' ? '+' : '−'}${money.format(t.amount)}</td>
      <td><button class="del" data-id="${t.id}" aria-label="Eliminar">✕</button></td>
    </tr>`).join('');
  $('#empty').hidden = rows.length > 0;
}

function expensesByCategory(txs) {
  const totals = {};
  for (const t of txs) {
    if (t.type === 'expense') totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  return totals;
}

function renderBreakdown(txs) {
  const totals = expensesByCategory(txs);
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    $('#category-breakdown').innerHTML = '<p class="muted">Sin gastos este mes.</p>';
    return;
  }
  const max = entries[0][1];
  $('#category-breakdown').innerHTML = entries.map(([cat, amount]) => {
    const budget = state.budgets[cat];
    const over = budget && amount > budget;
    const width = budget ? Math.min(100, (amount / budget) * 100) : (amount / max) * 100;
    const label = budget ? `${money.format(amount)} / ${money.format(budget)}` : money.format(amount);
    return `
      <div class="bar-row">
        <div class="bar-label"><span>${escapeHtml(cat)}</span><span class="${over ? 'neg' : ''}">${label}</span></div>
        <div class="bar-track"><div class="bar-fill ${over ? 'over' : ''}" style="width:${width}%"></div></div>
      </div>`;
  }).join('');
}

function renderBudgets() {
  const container = $('#budget-list');
  if (container.childElementCount) return; // los inputs se crean una sola vez
  container.innerHTML = CATEGORIES.expense.map((cat) => `
    <label>${escapeHtml(cat)}
      <input type="number" min="0" step="1" data-budget="${escapeHtml(cat)}" value="${state.budgets[cat] ?? ''}" placeholder="Sin límite">
    </label>`).join('');
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// --- Eventos ---

$('#tx-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const amount = Math.round(parseFloat(f.get('amount')) * 100) / 100;
  if (!(amount > 0)) return;
  state.transactions.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type: f.get('type'),
    description: f.get('description').trim(),
    amount,
    category: f.get('category'),
    date: f.get('date'),
    createdAt: Date.now(),
  });
  save();
  const date = f.get('date');
  e.target.reset();
  e.target.date.value = date;
  fillCategorySelect();
  $('#month').value = date.slice(0, 7);
  render();
});

document.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', fillCategorySelect));

$('#tx-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.del');
  if (!btn || !confirm('¿Eliminar este movimiento?')) return;
  state.transactions = state.transactions.filter((t) => t.id !== btn.dataset.id);
  save();
  render();
});

$('#budget-list').addEventListener('change', (e) => {
  const cat = e.target.dataset.budget;
  if (!cat) return;
  const v = parseFloat(e.target.value);
  if (v > 0) state.budgets[cat] = v;
  else delete state.budgets[cat];
  save();
  render();
});

$('#month').addEventListener('change', render);
$('#prev-month').addEventListener('click', () => shiftMonth(-1));
$('#next-month').addEventListener('click', () => shiftMonth(1));
$('#search').addEventListener('input', () => renderTable(monthTransactions()));

$('#export-csv').addEventListener('click', () => {
  const header = ['fecha', 'tipo', 'descripcion', 'categoria', 'monto'];
  const lines = [...state.transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [t.date, t.type === 'income' ? 'ingreso' : 'gasto', t.description, t.category, t.amount].map(csvCell).join(','));
  download('movimientos.csv', [header.join(','), ...lines].join('\n'), 'text/csv');
});

$('#export-json').addEventListener('click', () => {
  download(`finanzas-respaldo-${today()}.json`, JSON.stringify(state, null, 2), 'application/json');
});

$('#import-json').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.transactions)) throw new Error('formato');
    if (!confirm(`Se reemplazarán tus datos con ${data.transactions.length} movimientos. ¿Continuar?`)) return;
    state = { transactions: data.transactions, budgets: data.budgets || {} };
    save();
    $('#budget-list').innerHTML = '';
    render();
  } catch (_) {
    alert('El archivo no es un respaldo válido.');
  } finally {
    e.target.value = '';
  }
});

// --- Inicio ---
$('#month').value = today().slice(0, 7);
document.querySelector('#tx-form [name="date"]').value = today();
fillCategorySelect();
render();
