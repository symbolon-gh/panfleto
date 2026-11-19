---
title: Mapa
layout: default
permalink: /map.html
---

<div class="container py-4" id="mapa-panfletos">
  <h1>Mapa de la colección</h1>
  <p>Explora los lugares vinculados a las piezas que cuentan con coordenadas documentadas. El mapa señala lugares aludidos en los panfletos, no necesariamente sitios donde fueron impresos o producidos.</p>
  <div class="row g-3 align-items-end mb-3">
    <div class="col-md-4">
      <label class="form-label" for="filtro-mapa-periodo">Período</label>
      <select class="form-select" id="filtro-mapa-periodo">
        <option value="">Todos los períodos</option>
        <option value="1">1: 1973–1988</option>
        <option value="2">2: 1989–2005</option>
        <option value="3">3: 2006–2023</option>
      </select>
    </div>
    <div class="col-md-6">
      <label class="form-label" for="filtro-mapa-lugar">Lugar</label>
      <select class="form-select" id="filtro-mapa-lugar">
        <option value="">Todos los lugares</option>
      </select>
    </div>
    <div class="col-md-2">
      <button class="btn btn-outline-secondary w-100" id="limpiar-filtros-mapa" type="button">Restablecer</button>
    </div>
  </div>
  <p id="estado-mapa-panfletos" role="status" aria-live="polite">Preparando mapa…</p>
  <div id="lienzo-mapa-panfletos" style="height:65vh;min-height:440px;max-height:720px;border:1px solid #ced4da;border-radius:6px" aria-label="Mapa interactivo de los panfletos"></div>
  <p class="small text-muted mt-2">Una pieza puede aparecer en más de un lugar. Las fichas sin coordenadas no generan puntos en el mapa. Los marcadores pueden superponerse en lugares muy próximos: acerca el mapa para distinguirlos.</p>
</div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  const entradas = {{ site.data.geolugares | jsonify }};
  const urlFichas = {{ '/items/' | relative_url | jsonify }};
  const selPeriodo = document.getElementById('filtro-mapa-periodo');
  const selLugar = document.getElementById('filtro-mapa-lugar');
  const estado = document.getElementById('estado-mapa-panfletos');
  const limpiar = document.getElementById('limpiar-filtros-mapa');
  const parametros = new URLSearchParams(window.location.search);
  if (typeof L === 'undefined') {
    estado.textContent = 'No se pudo cargar el mapa. Comprueba la conexión a Internet.';
    return;
  }
  const mapa = L.map('lienzo-mapa-panfletos', {scrollWheelZoom:false}).setView([-33.46,-70.66], 10);
   mapa.attributionControl.setPrefix(false);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:18,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);
  const capa = L.layerGroup().addTo(mapa);
  const col = new Intl.Collator('es', {numeric:true, sensitivity:'base'});
  const lugares = Array.from(new Set(entradas.map(x => x.location).filter(Boolean))).sort(col.compare);
  lugares.forEach(nombre => {
    const opcion = new Option(nombre, nombre);
    opcion.dataset.glosarioTipo = 'lugar';
    opcion.dataset.glosarioEs = encodeURIComponent(nombre);
    opcion.classList.add('notranslate');
    opcion.setAttribute('translate', 'no');
    selLugar.add(opcion);
  });
  if (['1','2','3'].includes(parametros.get('periodo'))) selPeriodo.value = parametros.get('periodo');
  if (lugares.includes(parametros.get('lugar'))) selLugar.value = parametros.get('lugar');
  const filtroPieza = /^\d{3}_a$/.test(parametros.get('pieza') || '') ? parametros.get('pieza') : '';
  if (filtroPieza) {
    const aviso = document.createElement('p');
    aviso.className = 'alert alert-info py-2';
    aviso.appendChild(document.createTextNode('Mostrando los puntos de la pieza ' + filtroPieza + '. '));
    const a = document.createElement('a');
    a.href = window.location.pathname;
    a.textContent = 'Ver todas las piezas';
    aviso.appendChild(a);
    document.getElementById('mapa-panfletos').insertBefore(aviso, estado);
  }
  // Fusionar anverso y reverso solamente cuando sus lugares y coordenadas coinciden.
  const asociaciones = new Map();
  entradas.forEach(r => {
    const la = Number(r.latitude), lo = Number(r.longitude);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    const clave = JSON.stringify([r.pieza, r.location, r.latitude, r.longitude]);
    if (!asociaciones.has(clave)) asociaciones.set(clave, {
      pieza:r.pieza, lugar:r.location, lat:la, lon:lo,
      periodo:String(r.periodo), titulo:r.titulo || r.pieza, caras:[]
    });
    const a = asociaciones.get(clave);
    if (!a.caras.includes(r.cara)) a.caras.push(r.cara);
  });
  function render() {
    capa.clearLayers();
    const per = selPeriodo.value, lugar = selLugar.value;
    const visibles = Array.from(asociaciones.values()).filter(x =>
      (!per || x.periodo === per) && (!lugar || x.lugar === lugar) &&
      (!filtroPieza || x.pieza === filtroPieza)
    );
    const coordenadas = new Map();
    visibles.forEach(x => {
   const clave = x.lugar;
      if (!coordenadas.has(clave)) coordenadas.set(clave, []);
      coordenadas.get(clave).push(x);
    });
    const bounds = [];
    coordenadas.forEach(puntos => {
      const {lat,lon} = puntos[0];
      bounds.push([lat,lon]);
      const lista = document.createElement('div');
      lista.style.maxHeight = '270px';
      lista.style.overflowY = 'auto';
      const ul = document.createElement('ul');
      ul.style.paddingLeft = '20px';
      puntos.sort((a,b) => col.compare(a.pieza,b.pieza)).forEach(p => {
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        const link = document.createElement('a');
        link.href = urlFichas + encodeURIComponent(p.pieza) + '.html';
        link.textContent = p.titulo + ' (' + p.pieza + ')';
        li.appendChild(link);
        const subtitulo = document.createElement('div');
        subtitulo.className = 'small text-muted';
        const sitio = document.createElement('span');
        sitio.textContent = p.lugar;
        sitio.dataset.glosarioTipo = 'lugar';
        sitio.dataset.glosarioEs = encodeURIComponent(p.lugar);
        sitio.classList.add('notranslate');
        sitio.setAttribute('translate', 'no');
        subtitulo.appendChild(sitio);
        subtitulo.appendChild(document.createTextNode(' · ' + p.caras.join(' y ')));
        li.appendChild(subtitulo);
        ul.appendChild(li);
      });
      lista.appendChild(ul);
      L.marker([lat,lon]).addTo(capa).bindPopup(lista, {maxWidth:380});
    });
    if (bounds.length === 1) mapa.setView(bounds[0], 14);
    else if (bounds.length > 1) mapa.fitBounds(bounds, {padding:[28,28], maxZoom:14});
    const piezas = new Set(visibles.map(x => x.pieza)).size;
    estado.textContent = piezas + (piezas === 1 ? ' pieza en ' : ' piezas en ') + visibles.length + (visibles.length === 1 ? ' asociación geográfica (' : ' asociaciones geográficas (') + coordenadas.size + (coordenadas.size === 1 ? ' lugar representado).' : ' lugares representados).');
    if (!visibles.length) estado.textContent = 'No hay piezas con coordenadas para estos filtros.';
  }
  selPeriodo.addEventListener('change', render);
  selLugar.addEventListener('change', render);
  limpiar.addEventListener('click', function () {
    selPeriodo.value = '';
    selLugar.value = '';
    if (filtroPieza) window.location.assign(window.location.pathname);
    else render();
  });
  render();
});
</script>
