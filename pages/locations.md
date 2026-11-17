---
title: Lugares
layout: default
permalink: /locations.html
---

<div class="container py-4" id="lugares-panfletos">
  <h1>Lugares de la colección</h1>
  <p>Explora los lugares mencionados o representados en los panfletos con coordenadas identificadas. Cada lugar reúne las piezas asociadas, sin contar dos veces anverso y reverso de un mismo panfleto.</p>
  <div class="row g-3 align-items-end mb-3">
    <div class="col-md-4">
      <label class="form-label" for="filtro-lugares-periodo">Período</label>
      <select class="form-select" id="filtro-lugares-periodo">
        <option value="">Todos los períodos</option>
        <option value="1">1: 1973–1988</option>
        <option value="2">2: 1989–2005</option>
        <option value="3">3: 2006–2023</option>
      </select>
    </div>
    <div class="col-md-6">
      <label class="form-label" for="buscar-nombre-lugar">Buscar por nombre de lugar</label>
      <input class="form-control" id="buscar-nombre-lugar" type="search" placeholder="Escribe un nombre, calle o ciudad…">
    </div>
    <div class="col-md-2">
      <button class="btn btn-outline-secondary w-100" id="limpiar-filtros-lugares" type="button">Restablecer</button>
    </div>
  </div>
  <p id="lugares-estado" role="status" aria-live="polite">Preparando lugares…</p>
  <div class="row g-3" id="lugares-lista"></div>
</div>
<script>
document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  const entradas = {{ site.data.geolugares | jsonify }};
  const urlFichas = {{ '/items/' | relative_url | jsonify }};
  const urlMapa = {{ '/map.html' | relative_url | jsonify }};
  const periodo = document.getElementById('filtro-lugares-periodo');
  const busqueda = document.getElementById('buscar-nombre-lugar');
  const lista = document.getElementById('lugares-lista');
  const estado = document.getElementById('lugares-estado');
  const limpiar = document.getElementById('limpiar-filtros-lugares');
  const col = new Intl.Collator('es', {numeric:true, sensitivity:'base'});
  const params = new URLSearchParams(window.location.search);
  if (['1','2','3'].includes(params.get('periodo'))) periodo.value = params.get('periodo');
  // Agrupacion por nombre + pieza: una pieza con dos caras cuenta una sola vez.
  const asociaciones = new Map();
  entradas.forEach(r => {
    const clave = JSON.stringify([r.location, r.pieza]);
    if (!asociaciones.has(clave)) asociaciones.set(clave, {
      lugar:r.location, pieza:r.pieza, titulo:r.titulo || r.pieza, periodo:String(r.periodo)
    });
  });
  function normalizar(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
  function render() {
    lista.replaceChildren();
    const per = periodo.value, q = normalizar(busqueda.value.trim());
    const agrupados = new Map();
    asociaciones.forEach(p => {
      if (per && p.periodo !== per) return;
      if (q && !normalizar(p.lugar).includes(q)) return;
      if (!agrupados.has(p.lugar)) agrupados.set(p.lugar, []);
      agrupados.get(p.lugar).push(p);
    });
   const nombres = Array.from(agrupados.keys()).sort((a,b) => agrupados.get(b).length - agrupados.get(a).length || col.compare(a,b));
    let totalPiezas = new Set();
    nombres.forEach(nombre => {
      const piezas = agrupados.get(nombre).sort((a,b) => col.compare(a.pieza,b.pieza));
      piezas.forEach(p => totalPiezas.add(p.pieza));
      const colDiv = document.createElement('div');
      colDiv.className = 'col-12 col-lg-6';
      const card = document.createElement('section');
      card.className = 'border rounded p-3 h-100';
      const heading = document.createElement('h2');
      heading.className = 'h5 mb-1';
      heading.textContent = nombre;
      card.appendChild(heading);
      const cantidad = document.createElement('p');
      cantidad.className = 'text-muted small mb-2';
      cantidad.textContent = piezas.length + (piezas.length === 1 ? ' pieza' : ' piezas');
      card.appendChild(cantidad);
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.className = 'mb-2';
      summary.textContent = 'Ver piezas relacionadas';
      details.appendChild(summary);
      const ul = document.createElement('ul');
      ul.className = 'mt-2';
      piezas.forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = urlFichas + encodeURIComponent(p.pieza) + '.html';
        a.textContent = p.titulo + ' (' + p.pieza + ')';
        li.appendChild(a);
        ul.appendChild(li);
      });
      details.appendChild(ul);
      card.appendChild(details);
      const link = document.createElement('a');
      const u = new URL(urlMapa, window.location.href);
      u.searchParams.set('lugar', nombre);
      if (per) u.searchParams.set('periodo', per);
      link.href = u.toString();
      link.className = 'btn btn-sm btn-outline-primary mt-2';
      link.textContent = 'Ver en el mapa';
      card.appendChild(link);
      colDiv.appendChild(card);
      lista.appendChild(colDiv);
    });
    estado.textContent = nombres.length + (nombres.length === 1 ? ' lugar' : ' lugares') + ' y ' + totalPiezas.size + (totalPiezas.size === 1 ? ' pieza' : ' piezas') + ' en la selección.';
    if (!nombres.length) estado.textContent = 'No hay lugares que coincidan con estos filtros.';
  }
  periodo.addEventListener('change',render);
  busqueda.addEventListener('input',render);
  limpiar.addEventListener('click',function () {periodo.value=''; busqueda.value=''; render();});
  render();
});
</script>
