'use strict';

/* =====================================================================
   MIS FINANZAS — app.js
   Secciones:
     1. Datos iniciales
     2. Guardado (localStorage)
     3. Utilidades (formatos de dinero y fechas)
     4. Cálculos (mismas fórmulas que el Excel)
     5. Pantalla Panel
     6. Pantalla Registrar
     7. Pantalla Movimientos
     8. Pantallas Deudas y Compromisos
     9. Pantalla Ajustes (listas, deudas, compromisos, CSV, respaldo)
    10. Navegación e inicio
   ===================================================================== */

/* ===================== 1. DATOS INICIALES ===================== */

const EFECTIVO = 'Efectivo / Débito';
const TIPOS = ['Ingreso', 'Gasto', 'Pago'];

const DATOS_INICIALES = {
  version: 1,
  efectivoInicial: 1726.86,
  mesConsulta: '', // vacío = mes actual
  fuentes: ['Ventas', 'Sueldo', 'NovaStudio', 'Trabajo extra', 'Comisiones', 'Préstamo recibido', 'Regalo / Apoyo', 'Otro ingreso'],
  categorias: ['Comida', 'Transporte', 'Servicios', 'Hogar', 'Salud', 'Ropa', 'Entretenimiento', 'Suscripciones', 'Pago de deuda', 'Pago de compromiso', 'Otros gastos'],
  deudas: [
    { nombre: 'TC BBVA', tipo: 'Tarjeta', saldoInicial: 6739.80, disponibleInicial: 60.20, pagoFijo: null, diaCorte: 14, diaLimite: 5, estatus: 'Al día' },
    { nombre: 'TC Stori', tipo: 'Tarjeta', saldoInicial: 1932.24, disponibleInicial: 67.76, pagoFijo: null, diaCorte: 12, diaLimite: null, estatus: 'Al día' },
    { nombre: 'TC Nu', tipo: 'Tarjeta', saldoInicial: 1946.85, disponibleInicial: 3.15, pagoFijo: null, diaCorte: null, diaLimite: null, estatus: 'Al día' },
    { nombre: 'TC Plata', tipo: 'Tarjeta', saldoInicial: 221.58, disponibleInicial: 78.42, pagoFijo: null, diaCorte: null, diaLimite: null, estatus: 'Al día' },
    { nombre: 'Tarjeta C&A', tipo: 'Tarjeta', saldoInicial: 5686.00, disponibleInicial: 0, pagoFijo: null, diaCorte: null, diaLimite: null, estatus: 'Atrasada' },
    { nombre: 'C&A Préstamo', tipo: 'Préstamo', saldoInicial: 8420.00, disponibleInicial: null, pagoFijo: null, diaCorte: null, diaLimite: null, estatus: 'Atrasado' },
    { nombre: 'Stori Préstamo', tipo: 'Préstamo', saldoInicial: 5550.00, disponibleInicial: null, pagoFijo: 1110, diaCorte: null, diaLimite: null, estatus: 'Al día' },
    { nombre: 'TC Otra', tipo: 'Tarjeta', saldoInicial: 1867.00, disponibleInicial: 333.00, pagoFijo: null, diaCorte: null, diaLimite: null, estatus: 'Al día' },
    { nombre: 'Mercado Pago', tipo: 'Préstamo', saldoInicial: 4400.00, disponibleInicial: null, pagoFijo: 4400, diaCorte: null, diaLimite: 29, estatus: 'Al día' },
  ],
  compromisos: [
    { nombre: 'Telcel', frecuencia: 'Mensual', dia1: 4, dia2: null, monto: 1676 },
    { nombre: 'Isa Vargas', frecuencia: 'Mensual', dia1: 9, dia2: null, monto: 625 },
    { nombre: 'Roy', frecuencia: 'Mensual', dia1: 30, dia2: null, monto: 1000 },
    { nombre: 'Edson', frecuencia: 'Mensual', dia1: 30, dia2: null, monto: 700 },
    { nombre: 'Silver', frecuencia: 'Quincenal', dia1: 24, dia2: 29, monto: 1417 },
    { nombre: 'Stori Préstamo', frecuencia: 'Quincenal', dia1: 15, dia2: 29, monto: 1110 },
    { nombre: 'Mercado Pago', frecuencia: 'Mensual', dia1: 29, dia2: null, monto: 4400 },
  ],
  movimientos: [
    { fecha: '2026-10-01', tipo: 'Pago', categoria: 'Servicios', concepto: 'Pago de plan', cuenta: 'Telcel', pagadoCon: '', monto: 1676.86 },
    { fecha: '2026-10-12', tipo: 'Ingreso', categoria: 'Regalo / Apoyo', concepto: 'Papá Lunes', cuenta: '', pagadoCon: '', monto: 500 },
  ],
};

/* ===================== 2. GUARDADO ===================== */

const CLAVE = 'mis-finanzas-v1';
let datos = cargar();

function nuevoId() {
  return (crypto.randomUUID && crypto.randomUUID()) || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function numOVacio(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Revisa y completa datos (de localStorage o de un respaldo) para que tengan la forma correcta. */
function normalizar(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.movimientos)) throw new Error('Formato no válido');
  const texto = (v) => (v === null || v === undefined ? '' : String(v).trim());
  return {
    version: 1,
    efectivoInicial: numOVacio(d.efectivoInicial) ?? 0,
    mesConsulta: /^\d{4}-\d{2}$/.test(d.mesConsulta) ? d.mesConsulta : '',
    fuentes: Array.isArray(d.fuentes) ? d.fuentes.map(texto).filter(Boolean) : [...DATOS_INICIALES.fuentes],
    categorias: Array.isArray(d.categorias) ? d.categorias.map(texto).filter(Boolean) : [...DATOS_INICIALES.categorias],
    deudas: (d.deudas || []).map((x) => ({
      id: x.id || nuevoId(),
      nombre: texto(x.nombre),
      tipo: x.tipo === 'Préstamo' ? 'Préstamo' : 'Tarjeta',
      saldoInicial: numOVacio(x.saldoInicial) ?? 0,
      disponibleInicial: x.tipo === 'Préstamo' ? null : (numOVacio(x.disponibleInicial) ?? 0),
      pagoFijo: numOVacio(x.pagoFijo),
      diaCorte: numOVacio(x.diaCorte),
      diaLimite: numOVacio(x.diaLimite),
      estatus: texto(x.estatus) || 'Al día',
    })),
    compromisos: (d.compromisos || []).map((x) => ({
      id: x.id || nuevoId(),
      nombre: texto(x.nombre),
      frecuencia: x.frecuencia === 'Quincenal' ? 'Quincenal' : 'Mensual',
      dia1: numOVacio(x.dia1),
      dia2: x.frecuencia === 'Quincenal' ? numOVacio(x.dia2) : null,
      monto: numOVacio(x.monto) ?? 0,
    })),
    movimientos: d.movimientos.map((x) => ({
      id: x.id || nuevoId(),
      fecha: texto(x.fecha),
      tipo: texto(x.tipo),
      categoria: texto(x.categoria),
      concepto: texto(x.concepto),
      cuenta: texto(x.cuenta),
      pagadoCon: texto(x.pagadoCon),
      monto: Math.abs(numOVacio(x.monto) ?? 0),
    })),
  };
}

function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return normalizar(JSON.parse(guardado));
  } catch (e) {
    console.warn('No se pudieron leer los datos guardados', e);
  }
  return normalizar(JSON.parse(JSON.stringify(DATOS_INICIALES)));
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch (e) {
    alert('No se pudieron guardar los datos en este teléfono.');
  }
}

/* ===================== 3. UTILIDADES ===================== */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

const formatoPesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const formatoPct = new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatoMes = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });

/** $1,234.56 */
const pesos = (n) => formatoPesos.format(redondear(n) || 0);
const pct = (n) => formatoPct.format(n || 0);
/** Redondea a centavos para evitar errores de punto flotante (0.1 + 0.2). */
const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const suma = (lista, fn) => redondear(lista.reduce((s, x) => s + fn(x), 0));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Fecha de hoy a medianoche (hora local). */
function hoy() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
const dosDigitos = (n) => String(n).padStart(2, '0');
/** Date -> "aaaa-mm-dd" */
const aISO = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
/** "aaaa-mm-dd" -> Date */
const deISO = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
/** "aaaa-mm-dd" -> "dd/mm/aaaa" */
const fechaMX = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
const mesActual = () => aISO(hoy()).slice(0, 7);
const nombreMes = (aaaamm) => { const t = formatoMes.format(deISO(aaaamm + '-01')); return t[0].toUpperCase() + t.slice(1); };
const diasDelMes = (anio, mes0) => new Date(anio, mes0 + 1, 0).getDate();
const diferenciaDias = (a, b) => Math.round((a - b) / 86400000);

/** Mes que se está consultando (aaaa-mm). */
const mesConsulta = () => datos.mesConsulta || mesActual();

function avisar(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => el.classList.remove('visible'), 2500);
}

/* ===================== 4. CÁLCULOS ===================== */

/** Efecto en efectivo de un movimiento. */
function efectoEfectivo(m) {
  if (m.tipo === 'Ingreso') return m.monto;
  if (m.pagadoCon === '' || m.pagadoCon === EFECTIVO) return -m.monto;
  return 0; // pagado con tarjeta: no toca el efectivo
}

function calcularDeuda(d, movs) {
  const esTarjeta = d.tipo === 'Tarjeta';
  const limite = esTarjeta ? redondear(d.saldoInicial + (d.disponibleInicial || 0)) : null;
  const pagos = suma(movs.filter((m) => m.tipo === 'Pago' && m.cuenta === d.nombre), (m) => m.monto);
  const cargos = suma(movs.filter((m) => m.tipo !== 'Ingreso' && m.pagadoCon === d.nombre), (m) => m.monto);
  const saldo = redondear(Math.max(0, d.saldoInicial - pagos + cargos));
  const disponibleSinTope = esTarjeta ? redondear(limite - saldo) : null;
  const base = d.saldoInicial + cargos;
  return {
    ...d,
    esTarjeta,
    limite,
    pagos,
    cargos,
    saldo,
    disponible: esTarjeta ? Math.max(0, disponibleSinTope) : null,
    disponibleSinTope,
    uso: esTarjeta && limite > 0 ? saldo / limite : null,
    pagado: base > 0 ? pagos / base : 0,
    pagosRestantes: d.pagoFijo > 0 ? Math.ceil(redondear(saldo / d.pagoFijo)) : null,
    atrasada: /^atrasad/i.test(d.estatus),
  };
}

/** Fecha con ese día en el mes indicado; si el día no existe, usa el último día del mes. */
function fechaConDia(anio, mes0, dia) {
  const fecha = new Date(anio, mes0, 1);
  return new Date(fecha.getFullYear(), fecha.getMonth(), Math.min(dia, diasDelMes(fecha.getFullYear(), fecha.getMonth())));
}

function proximoPago(c, fechaHoy) {
  const dias = [c.dia1, c.frecuencia === 'Quincenal' ? c.dia2 : null].filter((x) => x >= 1 && x <= 31);
  let mejor = null;
  for (const dia of dias) {
    let f = fechaConDia(fechaHoy.getFullYear(), fechaHoy.getMonth(), dia);
    if (f < fechaHoy) f = fechaConDia(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, dia);
    if (!mejor || f < mejor) mejor = f;
  }
  return mejor;
}

function calcularCompromiso(c, movs, mes, fechaHoy) {
  const pagosAlMes = c.frecuencia === 'Quincenal' ? 2 : 1;
  const total = redondear(c.monto * pagosAlMes);
  const pagado = suma(movs.filter((m) => m.tipo === 'Pago' && m.cuenta === c.nombre && m.fecha.startsWith(mes)), (m) => m.monto);
  const pendiente = redondear(Math.max(0, total - pagado));
  const proximo = proximoPago(c, fechaHoy);
  const dias = proximo ? diferenciaDias(proximo, fechaHoy) : null;
  let estatus = 'Pendiente', clase = '';
  if (pendiente <= 0) { estatus = '✔ Pagado'; clase = 'verde'; }
  else if (dias !== null && dias <= 3) { estatus = '⚠ Pagar ya'; clase = 'roja'; }
  return { ...c, pagosAlMes, total, pagado, pendiente, proximo, dias, estatus, clase };
}

/** Calcula todo lo que muestran las pantallas. `movs` permite simular (vista previa). */
function calcular(movs = datos.movimientos) {
  const fechaHoy = hoy();
  const mes = mesConsulta();
  const deudas = datos.deudas.map((d) => calcularDeuda(d, movs));
  const compromisos = datos.compromisos.map((c) => calcularCompromiso(c, movs, mes, fechaHoy));
  const delMes = movs.filter((m) => m.fecha.startsWith(mes));
  const nombresDeuda = new Set(datos.deudas.map((d) => d.nombre));

  const efectivo = redondear(datos.efectivoInicial + suma(movs, efectoEfectivo));
  const ingresos = suma(delMes.filter((m) => m.tipo === 'Ingreso'), (m) => m.monto);
  const egresos = suma(delMes, (m) => Math.max(0, -efectoEfectivo(m)));
  const tarjetas = deudas.filter((d) => d.esTarjeta);
  const prestamos = deudas.filter((d) => !d.esTarjeta);
  const credito = suma(tarjetas, (d) => d.disponible);
  const deudaTarjetas = suma(tarjetas, (d) => d.saldo);
  const deudaPrestamos = suma(prestamos, (d) => d.saldo);
  const compTotal = suma(compromisos, (c) => c.total);
  const compPagado = suma(compromisos, (c) => c.pagado);
  const compPendiente = suma(compromisos, (c) => c.pendiente);

  return {
    mes, deudas, compromisos, delMes,
    efectivo, ingresos, egresos,
    balance: redondear(ingresos - egresos),
    credito, deudaTarjetas, deudaPrestamos,
    deudaTotal: redondear(deudaTarjetas + deudaPrestamos),
    compTotal, compPagado, compPendiente,
    alcanza: redondear(efectivo - compPendiente),
    cargado: suma(delMes.filter((m) => m.tipo !== 'Ingreso' && m.pagadoCon !== '' && m.pagadoCon !== EFECTIVO), (m) => m.monto),
    abonado: suma(delMes.filter((m) => m.tipo === 'Pago' && nombresDeuda.has(m.cuenta)), (m) => m.monto),
    disponibleTotal: redondear(efectivo + credito),
  };
}

/** Agrupa y suma montos por una propiedad, de mayor a menor. */
function agrupar(movs, campo) {
  const totales = new Map();
  for (const m of movs) totales.set(m[campo], redondear((totales.get(m[campo]) || 0) + m.monto));
  return [...totales].sort((a, b) => b[1] - a[1]);
}

/* ===================== 5. PANEL ===================== */

function ponerMonto(id, valor, colorSigno = false) {
  const el = $('#' + id);
  el.textContent = pesos(valor);
  if (colorSigno) el.className = valor < 0 ? 'negativo' : 'positivo';
}

function filasMontos(filas) {
  if (!filas.length) return '<tr><td class="nota">Sin movimientos en este mes.</td></tr>';
  const total = redondear(filas.reduce((s, f) => s + f[1], 0));
  return filas.map(([nombre, monto]) => `<tr><td>${esc(nombre || '(sin categoría)')}</td><td class="num">${pesos(monto)}</td></tr>`).join('')
    + `<tr><td><b>Total</b></td><td class="num"><b>${pesos(total)}</b></td></tr>`;
}

function mostrarPanel() {
  const r = calcular();
  $('#p-efectivo').textContent = pesos(r.efectivo);
  ponerMonto('p-ingresos', r.ingresos);
  ponerMonto('p-egresos', r.egresos);
  ponerMonto('p-balance', r.balance, true);
  ponerMonto('p-credito', r.credito);
  ponerMonto('p-deuda-tarjetas', r.deudaTarjetas);
  ponerMonto('p-deuda-prestamos', r.deudaPrestamos);
  ponerMonto('p-deuda-total', r.deudaTotal);
  ponerMonto('p-comp-total', r.compTotal);
  ponerMonto('p-comp-pagado', r.compPagado);
  ponerMonto('p-comp-pendiente', r.compPendiente);
  ponerMonto('p-alcanza', r.alcanza, true);
  ponerMonto('p-cargado', r.cargado);
  ponerMonto('p-abonado', r.abonado);
  ponerMonto('p-disponible-total', r.disponibleTotal);

  $('#p-tabla-fuentes').innerHTML = filasMontos(agrupar(r.delMes.filter((m) => m.tipo === 'Ingreso'), 'categoria'));
  $('#p-tabla-categorias').innerHTML = filasMontos(agrupar(r.delMes.filter((m) => m.tipo !== 'Ingreso'), 'categoria'));

  $('#p-tabla-deudas').innerHTML = r.deudas.map((d) => `
    <tr>
      <td>${esc(d.nombre)} ${d.atrasada ? '<span class="insignia roja">' + esc(d.estatus) + '</span>' : ''}</td>
      <td class="num">${pesos(d.saldo)}</td>
      <td class="num">${d.esTarjeta ? pesos(d.disponible) : 'n/a'}</td>
    </tr>`).join('') + `
    <tr><td><b>Total</b></td><td class="num"><b>${pesos(r.deudaTotal)}</b></td><td class="num"><b>${pesos(r.credito)}</b></td></tr>`;

  const proximos = r.compromisos.filter((c) => c.proximo).sort((a, b) => a.proximo - b.proximo);
  $('#p-tabla-proximos').innerHTML = proximos.map((c) => `
    <tr>
      <td>${esc(c.nombre)}<br><span class="insignia ${c.clase}">${c.estatus}</span></td>
      <td>${fechaMX(aISO(c.proximo))}<br><span class="nota">${textoDias(c.dias)}</span></td>
      <td class="num">${pesos(c.pendiente)}</td>
    </tr>`).join('') || '<tr><td class="nota">No hay compromisos.</td></tr>';

  const maximo = Math.max(1, ...r.deudas.map((d) => d.saldo + (d.disponible || 0)));
  $('#p-grafica').innerHTML = r.deudas.map((d) => `
    <div class="g-fila">
      <div class="g-titulo"><span>${esc(d.nombre)}</span><span>${pesos(d.saldo)}${d.esTarjeta ? ' / ' + pesos(d.disponible) : ''}</span></div>
      <div class="g-barra">
        <div class="saldo" style="width:${(d.saldo / maximo) * 100}%"></div>
        <div class="disponible" style="width:${((d.disponible || 0) / maximo) * 100}%"></div>
      </div>
    </div>`).join('') || '<p class="nota">No hay deudas.</p>';
}

function textoDias(dias) {
  if (dias === null) return '';
  if (dias === 0) return 'hoy';
  return dias === 1 ? 'en 1 día' : `en ${dias} días`;
}

/* ===================== 6. REGISTRAR ===================== */

const formMov = $('#form-mov');
let editandoId = null;

/** Llena un <select> con opciones; conserva el valor actual aunque ya no exista en la lista. */
function llenarSelect(select, opciones, valor, textoVacio) {
  const lista = [...new Set(opciones)];
  if (valor && !lista.includes(valor)) lista.push(valor);
  select.innerHTML = (textoVacio !== undefined ? `<option value="">${esc(textoVacio)}</option>` : '')
    + lista.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
  select.value = valor || (textoVacio !== undefined ? '' : lista[0] || '');
}

const nombresCuentas = () => [EFECTIVO, ...datos.deudas.map((d) => d.nombre), ...datos.compromisos.map((c) => c.nombre)];
const nombresTarjetas = () => datos.deudas.filter((d) => d.tipo === 'Tarjeta').map((d) => d.nombre);

function actualizarFormularioMov() {
  const f = formMov.elements;
  const esIngreso = f.tipo.value === 'Ingreso';
  $('#etiqueta-categoria').textContent = esIngreso ? 'Fuente de ingreso' : 'Categoría de gasto';
  llenarSelect(f.categoria, esIngreso ? datos.fuentes : datos.categorias, f.categoria.value, '— Elige —');
  llenarSelect(f.cuenta, nombresCuentas(), f.cuenta.value, '(ninguna)');
  llenarSelect(f.pagadoCon, [EFECTIVO, ...nombresTarjetas()], f.pagadoCon.value || EFECTIVO);
  $('#campo-pagado-con').hidden = esIngreso;
  mostrarVistaPrevia();
}

/** Arma el movimiento con los valores del formulario aplicando las reglas del Excel. */
function leerFormularioMov() {
  const f = formMov.elements;
  const tipo = f.tipo.value;
  let pagadoCon = tipo === 'Ingreso' ? '' : f.pagadoCon.value;
  if (tipo !== 'Ingreso' && !pagadoCon) pagadoCon = EFECTIVO;
  return {
    id: editandoId || nuevoId(),
    fecha: f.fecha.value,
    tipo,
    categoria: f.categoria.value,
    concepto: f.concepto.value.trim(),
    cuenta: f.cuenta.value,
    pagadoCon,
    monto: redondear(parseFloat(f.monto.value)),
  };
}

function validarMov(m) {
  const errores = [];
  if (!m.fecha) errores.push('La fecha es obligatoria.');
  if (!TIPOS.includes(m.tipo)) errores.push('Elige el tipo de movimiento.');
  if (!m.categoria) errores.push(m.tipo === 'Ingreso' ? 'Elige la fuente de ingreso.' : 'Elige la categoría.');
  if (m.tipo === 'Pago' && !m.cuenta) errores.push('En un Pago, la Cuenta / Deuda es obligatoria.');
  if (!(m.monto > 0)) errores.push('El monto debe ser mayor a 0.');
  return errores;
}

function mostrarVistaPrevia() {
  const m = leerFormularioMov();
  const caja = $('#vista-previa');
  if (!TIPOS.includes(m.tipo) || !(m.monto > 0)) { caja.innerHTML = ''; return; }

  const actual = calcular();
  const simulados = datos.movimientos.filter((x) => x.id !== editandoId).concat(m);
  const despues = calcular(simulados);
  let html = `
    <div><span>Efectivo actual</span><b>${pesos(actual.efectivo)}</b></div>
    <div><span>Efectivo después de registrar</span><b class="${despues.efectivo < 0 ? 'negativo' : ''}">${pesos(despues.efectivo)}</b></div>`;
  const tarjeta = m.tipo !== 'Ingreso' && despues.deudas.find((d) => d.esTarjeta && d.nombre === m.pagadoCon);
  if (tarjeta) {
    const excede = tarjeta.disponibleSinTope < 0;
    html += `<div><span>Disponible que le quedaría a ${esc(tarjeta.nombre)}</span>
      <b class="${excede ? 'negativo' : ''}">${pesos(tarjeta.disponibleSinTope)}</b></div>`;
    if (excede) html += '<div class="negativo">⚠ Este cargo excede el límite de la tarjeta.</div>';
  }
  caja.innerHTML = html;
}

function limpiarFormularioMov() {
  editandoId = null;
  formMov.reset();
  formMov.elements.fecha.value = aISO(hoy());
  formMov.elements.pagadoCon.value = EFECTIVO;
  $('#errores-mov').innerHTML = '';
  $('#form-mov-titulo').textContent = 'Nuevo movimiento';
  $('#btn-guardar-mov').textContent = 'Guardar';
  $('#btn-cancelar-edicion').hidden = true;
  actualizarFormularioMov();
}

function editarMovimiento(id) {
  const m = datos.movimientos.find((x) => x.id === id);
  if (!m) return;
  editandoId = id;
  const f = formMov.elements;
  f.fecha.value = m.fecha;
  f.tipo.value = m.tipo;
  actualizarFormularioMov();
  llenarSelect(f.categoria, m.tipo === 'Ingreso' ? datos.fuentes : datos.categorias, m.categoria, '— Elige —');
  llenarSelect(f.cuenta, nombresCuentas(), m.cuenta, '(ninguna)');
  llenarSelect(f.pagadoCon, [EFECTIVO, ...nombresTarjetas()], m.pagadoCon || EFECTIVO);
  f.concepto.value = m.concepto;
  f.monto.value = m.monto;
  $('#form-mov-titulo').textContent = 'Editar movimiento';
  $('#btn-guardar-mov').textContent = 'Guardar cambios';
  $('#btn-cancelar-edicion').hidden = false;
  mostrarVistaPrevia();
  location.hash = '#registrar';
}

formMov.addEventListener('submit', (e) => {
  e.preventDefault();
  const m = leerFormularioMov();
  const errores = validarMov(m);
  $('#errores-mov').innerHTML = errores.map((x) => `<li>${esc(x)}</li>`).join('');
  if (errores.length) return;

  const eraEdicion = Boolean(editandoId);
  if (eraEdicion) datos.movimientos = datos.movimientos.map((x) => (x.id === m.id ? m : x));
  else datos.movimientos.push(m);
  guardar();
  limpiarFormularioMov();
  avisar(eraEdicion ? 'Movimiento actualizado ✔' : 'Movimiento registrado ✔');
  if (eraEdicion) location.hash = '#movimientos';
});

formMov.elements.tipo.addEventListener('change', actualizarFormularioMov);
formMov.addEventListener('input', mostrarVistaPrevia);
$('#btn-cancelar-edicion').addEventListener('click', () => { limpiarFormularioMov(); location.hash = '#movimientos'; });

/* ===================== 7. MOVIMIENTOS ===================== */

function mostrarMovimientos() {
  const filtroMes = $('#filtro-mes-mov');
  const meses = [...new Set(datos.movimientos.map((m) => m.fecha.slice(0, 7)))].sort().reverse();
  const elegido = filtroMes.value;
  filtroMes.innerHTML = '<option value="">Todos los meses</option>'
    + meses.map((m) => `<option value="${m}">${esc(nombreMes(m))}</option>`).join('');
  filtroMes.value = meses.includes(elegido) ? elegido : '';

  const q = $('#buscar-mov').value.trim().toLowerCase();
  const lista = datos.movimientos
    .filter((m) => !filtroMes.value || m.fecha.startsWith(filtroMes.value))
    .filter((m) => !q || [m.concepto, m.categoria, m.cuenta, m.pagadoCon, m.tipo].join(' ').toLowerCase().includes(q))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  $('#resumen-mov').textContent = `${lista.length} movimiento${lista.length === 1 ? '' : 's'}`;
  $('#lista-mov').innerHTML = lista.map((m) => {
    const esIngreso = m.tipo === 'Ingreso';
    const conTarjeta = !esIngreso && m.pagadoCon && m.pagadoCon !== EFECTIVO;
    const detalle = [fechaMX(m.fecha), m.tipo, m.categoria, m.cuenta && '→ ' + m.cuenta, !esIngreso && 'con ' + (m.pagadoCon || EFECTIVO)]
      .filter(Boolean).map(esc).join(' · ');
    return `
      <div class="tarjeta mov">
        <div class="mov-fila">
          <span class="mov-concepto">${esc(m.concepto || m.categoria)}</span>
          <span class="mov-monto ${esIngreso ? 'positivo' : conTarjeta ? '' : 'negativo'}">${esIngreso ? '+' : '−'}${pesos(m.monto)}</span>
        </div>
        <div class="mov-detalle">${detalle}</div>
        <div class="botones">
          <button type="button" class="chico" data-editar="${m.id}">✎ Editar</button>
          <button type="button" class="chico peligro" data-borrar="${m.id}">✕ Borrar</button>
        </div>
      </div>`;
  }).join('') || '<p class="nota">No hay movimientos.</p>';
}

$('#lista-mov').addEventListener('click', (e) => {
  const editar = e.target.closest('[data-editar]');
  const borrar = e.target.closest('[data-borrar]');
  if (editar) editarMovimiento(editar.dataset.editar);
  if (borrar && confirm('¿Borrar este movimiento? No se puede deshacer.')) {
    datos.movimientos = datos.movimientos.filter((m) => m.id !== borrar.dataset.borrar);
    guardar();
    mostrarMovimientos();
    avisar('Movimiento borrado');
  }
});
$('#buscar-mov').addEventListener('input', mostrarMovimientos);
$('#filtro-mes-mov').addEventListener('change', mostrarMovimientos);

/* ===================== 8. DEUDAS Y COMPROMISOS ===================== */

const fila = (etiqueta, valor) => `<dt>${etiqueta}</dt><dd>${valor}</dd>`;
const o = (v) => (v === null || v === undefined || v === '' ? '—' : v);

function mostrarDeudas() {
  const r = calcular();
  $('#lista-deudas').innerHTML = `
    <div class="cuadricula-kpi">
      <div class="kpi"><span>Deuda en tarjetas</span><strong>${pesos(r.deudaTarjetas)}</strong></div>
      <div class="kpi"><span>Deuda en préstamos</span><strong>${pesos(r.deudaPrestamos)}</strong></div>
      <div class="kpi"><span>DEUDA TOTAL</span><strong class="negativo">${pesos(r.deudaTotal)}</strong></div>
      <div class="kpi"><span>Disponible en crédito</span><strong>${pesos(r.credito)}</strong></div>
    </div>` + r.deudas.map((d) => `
    <div class="tarjeta">
      <div class="encabezado">
        <h2>${esc(d.nombre)}</h2>
        <span class="insignia ${d.atrasada ? 'roja' : ''}">${esc(d.estatus)}</span>
      </div>
      ${d.esTarjeta ? `
        <div class="barra"><div class="${d.uso >= 0.9 ? 'alta' : ''}" style="width:${Math.min(100, (d.uso || 0) * 100)}%"></div></div>
        <p class="nota">Uso: ${pct(d.uso)}</p>` : ''}
      <dl class="datos">
        ${fila('Tipo', esc(d.tipo))}
        ${fila('Límite', d.esTarjeta ? pesos(d.limite) : 'n/a')}
        ${fila('Saldo inicial', pesos(d.saldoInicial))}
        ${fila('Pagos registrados', pesos(d.pagos))}
        ${fila('Cargos con la tarjeta', pesos(d.cargos))}
        ${fila('<b>Saldo actual</b>', `<b>${pesos(d.saldo)}</b>`)}
        ${fila('Disponible actual', d.esTarjeta ? pesos(d.disponible) : 'n/a')}
        ${fila('% pagado', pct(d.pagado))}
        ${fila('Pago fijo', d.pagoFijo ? pesos(d.pagoFijo) : '—')}
        ${fila('Pagos restantes', o(d.pagosRestantes))}
        ${fila('Día de corte', o(d.diaCorte))}
        ${fila('Día límite de pago', o(d.diaLimite))}
      </dl>
    </div>`).join('');
}

function mostrarCompromisos() {
  const r = calcular();
  $('#lista-compromisos').innerHTML = `
    <div class="cuadricula-kpi">
      <div class="kpi"><span>Total del mes</span><strong>${pesos(r.compTotal)}</strong></div>
      <div class="kpi"><span>Pagado</span><strong class="positivo">${pesos(r.compPagado)}</strong></div>
      <div class="kpi"><span>Pendiente</span><strong class="negativo">${pesos(r.compPendiente)}</strong></div>
      <div class="kpi"><span>¿Me alcanza?</span><strong class="${r.alcanza < 0 ? 'negativo' : 'positivo'}">${pesos(r.alcanza)}</strong></div>
    </div>` + r.compromisos.map((c) => `
    <div class="tarjeta">
      <div class="encabezado">
        <h2>${esc(c.nombre)}</h2>
        <span class="insignia ${c.clase}">${c.estatus}</span>
      </div>
      <dl class="datos">
        ${fila('Frecuencia', esc(c.frecuencia))}
        ${fila('Día(s) de pago', c.frecuencia === 'Quincenal' ? `${o(c.dia1)} y ${o(c.dia2)}` : o(c.dia1))}
        ${fila('Monto por pago', pesos(c.monto))}
        ${fila('Pagos al mes', c.pagosAlMes)}
        ${fila('Total mensual', pesos(c.total))}
        ${fila('Pagado en el mes', pesos(c.pagado))}
        ${fila('<b>Pendiente en el mes</b>', `<b>${pesos(c.pendiente)}</b>`)}
        ${fila('Próximo pago', c.proximo ? fechaMX(aISO(c.proximo)) : '—')}
        ${fila('Días para pagar', o(c.dias))}
      </dl>
    </div>`).join('');
}

/* ===================== 9. AJUSTES ===================== */

function mostrarAjustes() {
  $('#aj-efectivo').value = datos.efectivoInicial;

  for (const lista of ['fuentes', 'categorias']) {
    $('#aj-' + lista).innerHTML = datos[lista].map((item, i) => `
      <li><span>${esc(item)}</span>
        <button type="button" class="chico" data-lista="${lista}" data-renombrar="${i}" aria-label="Renombrar">✎</button>
        <button type="button" class="chico peligro" data-lista="${lista}" data-quitar="${i}" aria-label="Quitar">✕</button>
      </li>`).join('');
  }
  $('#aj-deudas').innerHTML = datos.deudas.map((d) => `
    <li><span>${esc(d.nombre)} <span class="nota">· ${esc(d.tipo)}</span></span>
      <button type="button" class="chico" data-editar-deuda="${d.id}">✎</button>
      <button type="button" class="chico peligro" data-borrar-deuda="${d.id}">✕</button>
    </li>`).join('') || '<li class="nota">Sin deudas.</li>';
  $('#aj-compromisos').innerHTML = datos.compromisos.map((c) => `
    <li><span>${esc(c.nombre)} <span class="nota">· ${esc(c.frecuencia)} · ${pesos(c.monto)}</span></span>
      <button type="button" class="chico" data-editar-compromiso="${c.id}">✎</button>
      <button type="button" class="chico peligro" data-borrar-compromiso="${c.id}">✕</button>
    </li>`).join('') || '<li class="nota">Sin compromisos.</li>';
}

$('#aj-efectivo').addEventListener('change', (e) => {
  const n = parseFloat(e.target.value);
  if (!Number.isFinite(n)) { e.target.value = datos.efectivoInicial; return; }
  datos.efectivoInicial = redondear(n);
  guardar();
  avisar('Efectivo inicial actualizado ✔');
});

/* --- Mes a consultar (hay un selector en Panel, Compromisos y Ajustes) --- */
function sincronizarMes() {
  $$('.input-mes').forEach((i) => { i.value = mesConsulta(); });
  $('#etiqueta-mes').textContent = nombreMes(mesConsulta());
}
$$('.input-mes').forEach((input) => input.addEventListener('change', () => {
  datos.mesConsulta = /^\d{4}-\d{2}$/.test(input.value) && input.value !== mesActual() ? input.value : '';
  guardar();
  mostrarPantalla();
}));
$$('.btn-mes-actual').forEach((b) => b.addEventListener('click', () => {
  datos.mesConsulta = '';
  guardar();
  mostrarPantalla();
}));

/* --- Listas: fuentes y categorías --- */
$$('.agregar-item').forEach((form) => form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('input', form);
  const valor = input.value.trim();
  const lista = datos[form.dataset.lista];
  if (!valor) return;
  if (lista.some((x) => x.toLowerCase() === valor.toLowerCase())) { alert('Ese nombre ya existe.'); return; }
  lista.push(valor);
  input.value = '';
  guardar();
  mostrarAjustes();
}));

$('#ajustes').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.renombrar !== undefined) renombrarItem(d.lista, Number(d.renombrar));
  else if (d.quitar !== undefined) quitarItem(d.lista, Number(d.quitar));
  else if (d.editarDeuda) abrirDeuda(d.editarDeuda);
  else if (d.borrarDeuda) borrarDeuda(d.borrarDeuda);
  else if (d.editarCompromiso) abrirCompromiso(d.editarCompromiso);
  else if (d.borrarCompromiso) borrarCompromiso(d.borrarCompromiso);
});

function renombrarItem(lista, i) {
  const viejo = datos[lista][i];
  const nuevo = (prompt('Nuevo nombre:', viejo) || '').trim();
  if (!nuevo || nuevo === viejo) return;
  if (datos[lista].some((x, j) => j !== i && x.toLowerCase() === nuevo.toLowerCase())) { alert('Ese nombre ya existe.'); return; }
  datos[lista][i] = nuevo;
  const esIngreso = lista === 'fuentes';
  let cambiados = 0;
  for (const m of datos.movimientos) {
    if (m.categoria === viejo && (m.tipo === 'Ingreso') === esIngreso) { m.categoria = nuevo; cambiados++; }
  }
  guardar();
  mostrarAjustes();
  avisar(cambiados ? `Renombrado ✔ (${cambiados} movimientos actualizados)` : 'Renombrado ✔');
}

function quitarItem(lista, i) {
  if (!confirm(`¿Quitar "${datos[lista][i]}" de la lista? Los movimientos que ya la usan no cambian.`)) return;
  datos[lista].splice(i, 1);
  guardar();
  mostrarAjustes();
}

/** Cambia un nombre de cuenta en los movimientos (Cuenta/Deuda y Pagado con). */
function renombrarEnMovimientos(viejo, nuevo) {
  let n = 0;
  for (const m of datos.movimientos) {
    if (m.cuenta === viejo) { m.cuenta = nuevo; n++; }
    if (m.pagadoCon === viejo) { m.pagadoCon = nuevo; n++; }
  }
  return n;
}

/* --- Deudas --- */
const dlgDeuda = $('#dlg-deuda');
const formDeuda = $('#form-deuda');
let deudaEditando = null;

function abrirDeuda(id) {
  deudaEditando = id || null;
  const d = datos.deudas.find((x) => x.id === id) || { tipo: 'Tarjeta', estatus: 'Al día' };
  const f = formDeuda.elements;
  for (const campo of ['nombre', 'tipo', 'saldoInicial', 'disponibleInicial', 'pagoFijo', 'diaCorte', 'diaLimite', 'estatus']) {
    f[campo].value = d[campo] ?? '';
  }
  if (![...f.estatus.options].some((op) => op.value === d.estatus)) f.estatus.add(new Option(d.estatus, d.estatus));
  f.estatus.value = d.estatus;
  $('#dlg-deuda-titulo').textContent = id ? 'Editar deuda' : 'Nueva deuda';
  $('.errores', formDeuda).innerHTML = '';
  actualizarDialogoDeuda();
  dlgDeuda.showModal();
}

function actualizarDialogoDeuda() {
  $('.solo-tarjeta', formDeuda).hidden = formDeuda.elements.tipo.value !== 'Tarjeta';
}
formDeuda.elements.tipo.addEventListener('change', actualizarDialogoDeuda);

function diaValido(v) { return v === null || (Number.isInteger(v) && v >= 1 && v <= 31); }

formDeuda.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = formDeuda.elements;
  const nueva = {
    id: deudaEditando || nuevoId(),
    nombre: f.nombre.value.trim(),
    tipo: f.tipo.value,
    saldoInicial: numOVacio(f.saldoInicial.value),
    disponibleInicial: f.tipo.value === 'Tarjeta' ? (numOVacio(f.disponibleInicial.value) ?? 0) : null,
    pagoFijo: numOVacio(f.pagoFijo.value),
    diaCorte: numOVacio(f.diaCorte.value),
    diaLimite: numOVacio(f.diaLimite.value),
    estatus: f.estatus.value,
  };
  const errores = [];
  if (!nueva.nombre) errores.push('El nombre es obligatorio.');
  if (nueva.nombre === EFECTIVO) errores.push(`El nombre no puede ser "${EFECTIVO}".`);
  if (datos.deudas.some((x) => x.id !== nueva.id && x.nombre.toLowerCase() === nueva.nombre.toLowerCase())) errores.push('Ya existe una deuda con ese nombre.');
  if (nueva.saldoInicial === null || nueva.saldoInicial < 0) errores.push('El saldo inicial debe ser 0 o mayor.');
  if (nueva.disponibleInicial !== null && nueva.disponibleInicial < 0) errores.push('El disponible inicial no puede ser negativo.');
  if (nueva.pagoFijo !== null && nueva.pagoFijo < 0) errores.push('El pago fijo no puede ser negativo.');
  if (!diaValido(nueva.diaCorte) || !diaValido(nueva.diaLimite)) errores.push('Los días deben estar entre 1 y 31.');
  $('.errores', formDeuda).innerHTML = errores.map((x) => `<li>${esc(x)}</li>`).join('');
  if (errores.length) return;

  const anterior = datos.deudas.find((x) => x.id === nueva.id);
  if (anterior) {
    if (anterior.nombre !== nueva.nombre && confirm(`¿Cambiar también "${anterior.nombre}" por "${nueva.nombre}" en los movimientos ya registrados?`)) {
      renombrarEnMovimientos(anterior.nombre, nueva.nombre);
    }
    Object.assign(anterior, nueva);
  } else {
    datos.deudas.push(nueva);
  }
  guardar();
  dlgDeuda.close();
  mostrarAjustes();
  avisar('Deuda guardada ✔');
});

function borrarDeuda(id) {
  const d = datos.deudas.find((x) => x.id === id);
  if (!d || !confirm(`¿Borrar la deuda "${d.nombre}"? Los movimientos registrados no se borran.`)) return;
  datos.deudas = datos.deudas.filter((x) => x.id !== id);
  guardar();
  mostrarAjustes();
}

/* --- Compromisos --- */
const dlgCompromiso = $('#dlg-compromiso');
const formCompromiso = $('#form-compromiso');
let compromisoEditando = null;

function abrirCompromiso(id) {
  compromisoEditando = id || null;
  const c = datos.compromisos.find((x) => x.id === id) || { frecuencia: 'Mensual' };
  const f = formCompromiso.elements;
  for (const campo of ['nombre', 'frecuencia', 'dia1', 'dia2', 'monto']) f[campo].value = c[campo] ?? '';
  $('#dlg-compromiso-titulo').textContent = id ? 'Editar compromiso' : 'Nuevo compromiso';
  $('.errores', formCompromiso).innerHTML = '';
  actualizarDialogoCompromiso();
  dlgCompromiso.showModal();
}

function actualizarDialogoCompromiso() {
  $('.solo-quincenal', formCompromiso).hidden = formCompromiso.elements.frecuencia.value !== 'Quincenal';
}
formCompromiso.elements.frecuencia.addEventListener('change', actualizarDialogoCompromiso);

formCompromiso.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = formCompromiso.elements;
  const nuevo = {
    id: compromisoEditando || nuevoId(),
    nombre: f.nombre.value.trim(),
    frecuencia: f.frecuencia.value,
    dia1: numOVacio(f.dia1.value),
    dia2: f.frecuencia.value === 'Quincenal' ? numOVacio(f.dia2.value) : null,
    monto: numOVacio(f.monto.value),
  };
  const errores = [];
  if (!nuevo.nombre) errores.push('El nombre es obligatorio.');
  if (nuevo.nombre === EFECTIVO) errores.push(`El nombre no puede ser "${EFECTIVO}".`);
  if (datos.compromisos.some((x) => x.id !== nuevo.id && x.nombre.toLowerCase() === nuevo.nombre.toLowerCase())) errores.push('Ya existe un compromiso con ese nombre.');
  if (nuevo.dia1 === null || !diaValido(nuevo.dia1)) errores.push('El Día 1 debe estar entre 1 y 31.');
  if (nuevo.frecuencia === 'Quincenal' && (nuevo.dia2 === null || !diaValido(nuevo.dia2))) errores.push('En quincenal, el Día 2 debe estar entre 1 y 31.');
  if (!(nuevo.monto > 0)) errores.push('El monto por pago debe ser mayor a 0.');
  $('.errores', formCompromiso).innerHTML = errores.map((x) => `<li>${esc(x)}</li>`).join('');
  if (errores.length) return;

  const anterior = datos.compromisos.find((x) => x.id === nuevo.id);
  if (anterior) {
    if (anterior.nombre !== nuevo.nombre && confirm(`¿Cambiar también "${anterior.nombre}" por "${nuevo.nombre}" en los movimientos ya registrados?`)) {
      renombrarEnMovimientos(anterior.nombre, nuevo.nombre);
    }
    Object.assign(anterior, nuevo);
  } else {
    datos.compromisos.push(nuevo);
  }
  guardar();
  dlgCompromiso.close();
  mostrarAjustes();
  avisar('Compromiso guardado ✔');
});

function borrarCompromiso(id) {
  const c = datos.compromisos.find((x) => x.id === id);
  if (!c || !confirm(`¿Borrar el compromiso "${c.nombre}"? Los movimientos registrados no se borran.`)) return;
  datos.compromisos = datos.compromisos.filter((x) => x.id !== id);
  guardar();
  mostrarAjustes();
}

$('#btn-nueva-deuda').addEventListener('click', () => abrirDeuda());
$('#btn-nuevo-compromiso').addEventListener('click', () => abrirCompromiso());
$$('dialog .btn-cerrar').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

/* --- Descargar archivos --- */
function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* --- CSV --- */
const COLUMNAS_CSV = ['Fecha', 'Tipo', 'Categoría/Fuente', 'Concepto', 'Cuenta/Deuda', 'Pagado con', 'Monto'];

function celdaCSV(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

$('#btn-exportar-csv').addEventListener('click', () => {
  const filas = [...datos.movimientos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m) => [fechaMX(m.fecha), m.tipo, m.categoria, m.concepto, m.cuenta, m.pagadoCon, m.monto.toFixed(2)].map(celdaCSV).join(','));
  // "﻿" ayuda a que Excel abra bien los acentos.
  descargar(`movimientos-${aISO(hoy())}.csv`, '﻿' + [COLUMNAS_CSV.join(','), ...filas].join('\r\n'), 'text/csv;charset=utf-8');
});

/** Convierte texto CSV en filas. Acepta comas o punto y coma y campos entre comillas. */
function leerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primera = texto.split(/\r?\n/, 1)[0];
  const sep = (primera.match(/;/g) || []).length > (primera.match(/,/g) || []).length ? ';' : ',';
  const filas = [];
  let filaActual = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { filaActual.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      filaActual.push(campo); filas.push(filaActual); filaActual = []; campo = '';
    } else campo += c;
  }
  if (campo || filaActual.length) { filaActual.push(campo); filas.push(filaActual); }
  return filas.filter((f) => f.some((x) => x.trim() !== ''));
}

/** Acepta dd/mm/aaaa, d/m/aaaa, dd-mm-aaaa o aaaa-mm-dd. Devuelve aaaa-mm-dd o null. */
function leerFecha(s) {
  s = s.trim();
  let a, m, d, r;
  if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, a, m, d] = r;
  else if ((r = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) [, d, m, a] = r;
  else return null;
  const f = new Date(+a, +m - 1, +d);
  return f.getFullYear() === +a && f.getMonth() === +m - 1 && f.getDate() === +d ? aISO(f) : null;
}

/** Acepta 1234.56, 1,234.56, $1,234.56 o 1234,56. */
function leerMonto(s) {
  s = s.replace(/[$\s]/g, '');
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(redondear(n)) : NaN;
}

async function importarCSV(archivo, reemplazar) {
  const filas = leerCSV(await archivo.text());
  if (filas.length && /fecha/i.test(filas[0][0])) filas.shift();
  const nuevos = [], malas = [];
  filas.forEach((f, i) => {
    const [fecha, tipo, categoria = '', concepto = '', cuenta = '', pagadoCon = '', monto = ''] = f.map((x) => (x || '').trim());
    const tipoOK = TIPOS.find((t) => t.toLowerCase() === (tipo || '').toLowerCase());
    const m = {
      id: nuevoId(),
      fecha: leerFecha(fecha || ''),
      tipo: tipoOK,
      categoria, concepto, cuenta,
      pagadoCon: tipoOK === 'Ingreso' ? '' : pagadoCon,
      monto: leerMonto(monto),
    };
    if (!m.fecha || !m.tipo || !(m.monto > 0)) malas.push(i + 2);
    else nuevos.push(m);
  });
  if (!nuevos.length) { alert('No se encontró ningún movimiento válido en el archivo.'); return; }
  const accion = reemplazar ? `REEMPLAZAR todos tus movimientos (${datos.movimientos.length}) por` : 'AGREGAR';
  let mensaje = `Se van a ${accion} ${nuevos.length} movimientos.`;
  if (malas.length) mensaje += `\n\n${malas.length} filas se ignorarán por datos inválidos (filas: ${malas.slice(0, 10).join(', ')}${malas.length > 10 ? '…' : ''}).`;
  if (!confirm(mensaje + '\n\n¿Continuar?')) return;
  datos.movimientos = reemplazar ? nuevos : datos.movimientos.concat(nuevos);
  guardar();
  avisar(`${nuevos.length} movimientos importados ✔`);
}

for (const [id, reemplazar] of [['#importar-csv-agregar', false], ['#importar-csv-reemplazar', true]]) {
  $(id).addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (archivo) await importarCSV(archivo, reemplazar).catch(() => alert('No se pudo leer el archivo CSV.'));
  });
}

/* --- Respaldo JSON --- */
$('#btn-respaldo').addEventListener('click', () => {
  const respaldo = { app: 'mis-finanzas', creado: new Date().toISOString(), datos };
  descargar(`respaldo-finanzas-${aISO(hoy())}.json`, JSON.stringify(respaldo, null, 2), 'application/json');
});

$('#restaurar-json').addEventListener('change', async (e) => {
  const archivo = e.target.files[0];
  e.target.value = '';
  if (!archivo) return;
  try {
    const contenido = JSON.parse(await archivo.text());
    const nuevos = normalizar(contenido.datos || contenido);
    if (!confirm(`Se reemplazará TODO con el respaldo (${nuevos.movimientos.length} movimientos, ${nuevos.deudas.length} deudas, ${nuevos.compromisos.length} compromisos). ¿Continuar?`)) return;
    datos = nuevos;
    guardar();
    mostrarPantalla();
    avisar('Respaldo restaurado ✔');
  } catch (err) {
    alert('El archivo no es un respaldo válido.');
  }
});

$('#btn-reiniciar').addEventListener('click', () => {
  if (!confirm('Esto BORRA todos tus datos y vuelve a los datos iniciales. Te recomiendo hacer un respaldo antes. ¿Continuar?')) return;
  if (!confirm('¿Seguro? No se puede deshacer.')) return;
  localStorage.removeItem(CLAVE);
  datos = cargar();
  guardar();
  limpiarFormularioMov();
  mostrarPantalla();
  avisar('Datos iniciales restablecidos');
});

/* ===================== 10. NAVEGACIÓN E INICIO ===================== */

const PANTALLAS = {
  panel: { titulo: 'Panel', mostrar: mostrarPanel },
  registrar: { titulo: 'Registrar', mostrar: actualizarFormularioMov },
  movimientos: { titulo: 'Movimientos', mostrar: mostrarMovimientos },
  deudas: { titulo: 'Deudas', mostrar: mostrarDeudas },
  compromisos: { titulo: 'Compromisos', mostrar: mostrarCompromisos },
  ajustes: { titulo: 'Ajustes', mostrar: mostrarAjustes },
};

function mostrarPantalla() {
  const id = PANTALLAS[location.hash.slice(1)] ? location.hash.slice(1) : 'panel';
  for (const sec of $$('.pantalla')) sec.hidden = sec.id !== id;
  for (const a of $$('.navegacion a')) a.classList.toggle('activa', a.dataset.pantalla === id);
  $('#titulo-pantalla').textContent = PANTALLAS[id].titulo;
  sincronizarMes();
  PANTALLAS[id].mostrar();
}

window.addEventListener('hashchange', () => { mostrarPantalla(); window.scrollTo(0, 0); });

// Si la app queda abierta de un día para otro, recalcula al volver a ella.
document.addEventListener('visibilitychange', () => { if (!document.hidden) mostrarPantalla(); });

limpiarFormularioMov();
mostrarPantalla();

// Service worker: permite instalar la app y usarla sin internet.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((e) => console.warn('Service worker no registrado', e));
  });
}
