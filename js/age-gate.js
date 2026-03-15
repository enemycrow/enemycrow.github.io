/**
 * age-gate.js — Verificación de edad para contenido +18
 * Se carga en el <head> (sin defer) para bloquear el renderizado hasta confirmar.
 * La verificación se almacena en localStorage por 30 días.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pluma_age_gate';
  var EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

  // Inyectar meta rating siempre (para crawlers)
  var metaRating = document.createElement('meta');
  metaRating.name = 'rating';
  metaRating.content = 'adult';
  document.head.appendChild(metaRating);

  // Comprobar si ya verificó
  function isVerified() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      return data && data.expires > Date.now();
    } catch (e) {
      return false;
    }
  }

  function setVerified() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        verified: true,
        expires: Date.now() + EXPIRY_MS
      }));
    } catch (e) { /* localStorage puede estar deshabilitado */ }
  }

  if (isVerified()) return;

  // Bloquear scroll mientras el gate está visible
  document.documentElement.style.overflow = 'hidden';

  // Estilos del overlay
  var style = document.createElement('style');
  style.textContent = [
    '#age-gate-overlay{',
    '  position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;',
    '  background:#09090f;',
    '  display:flex;align-items:center;justify-content:center;padding:1.5rem;',
    '  box-sizing:border-box;',
    '}',
    '#age-gate-box{',
    '  max-width:480px;width:100%;text-align:center;',
    '  background:linear-gradient(160deg,#10101c 0%,#0e0e1a 100%);',
    '  border:1px solid rgba(200,169,110,0.3);',
    '  border-radius:1rem;padding:2.5rem 2rem;',
    '  box-shadow:0 0 60px rgba(0,0,0,0.7);',
    '}',
    '#age-gate-icon{',
    '  font-size:2.2rem;margin-bottom:1rem;opacity:0.85;',
    '}',
    '#age-gate-title{',
    '  font-family:"Playfair Display","Georgia",serif;',
    '  font-size:1.45rem;font-weight:600;color:#f5f0e8;margin:0 0 0.5rem;',
    '}',
    '#age-gate-subtitle{',
    '  font-family:"Lora","Georgia",serif;font-size:0.875rem;',
    '  color:rgba(245,240,232,0.65);margin:0 0 1.75rem;line-height:1.6;',
    '}',
    '#age-gate-confirm{',
    '  display:block;width:100%;padding:0.75rem 1.25rem;',
    '  background:#c8a96e;color:#0a0a0a;',
    '  border:none;border-radius:0.5rem;cursor:pointer;',
    '  font-family:"Lora","Georgia",serif;font-size:0.95rem;font-weight:700;',
    '  margin-bottom:0.75rem;transition:background 0.2s;',
    '}',
    '#age-gate-confirm:hover{background:#dbbf82;}',
    '#age-gate-confirm:focus-visible{outline:2px solid #c8a96e;outline-offset:3px;}',
    '#age-gate-decline{',
    '  display:block;width:100%;padding:0.65rem 1rem;',
    '  background:transparent;color:rgba(245,240,232,0.55);',
    '  border:1px solid rgba(245,240,232,0.2);border-radius:0.5rem;cursor:pointer;',
    '  font-family:"Lora","Georgia",serif;font-size:0.85rem;',
    '  transition:border-color 0.2s,color 0.2s;',
    '}',
    '#age-gate-decline:hover{border-color:rgba(245,240,232,0.4);color:rgba(245,240,232,0.8);}',
    '#age-gate-decline:focus-visible{outline:2px solid rgba(245,240,232,0.5);outline-offset:3px;}',
    '#age-gate-legal{',
    '  margin-top:1.25rem;font-size:0.75rem;',
    '  color:rgba(245,240,232,0.3);line-height:1.5;',
    '}'
  ].join('');
  document.head.appendChild(style);

  // HTML del overlay
  var overlay = document.createElement('div');
  overlay.id = 'age-gate-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'age-gate-title');
  overlay.setAttribute('aria-describedby', 'age-gate-subtitle');
  overlay.innerHTML = [
    '<div id="age-gate-box">',
    '  <div id="age-gate-icon" aria-hidden="true">&#9998;</div>',
    '  <h1 id="age-gate-title">Contenido para adultos</h1>',
    '  <p id="age-gate-subtitle">',
    '    Esta obra contiene temáticas y lenguaje para mayores de&nbsp;18&nbsp;años.',
    '    Al continuar confirmas que tienes la edad legal en tu país.',
    '  </p>',
    '  <button id="age-gate-confirm" type="button">',
    '    Tengo 18 años — Continuar',
    '  </button>',
    '  <button id="age-gate-decline" type="button">',
    '    Volver al inicio',
    '  </button>',
    '  <p id="age-gate-legal">',
    '    La Pluma, el Faro y la Llama · Lectura responsable',
    '  </p>',
    '</div>'
  ].join('');

  // Insertar antes de que el body esté disponible, o justo al cargarse el DOM
  function mount() {
    if (document.body) {
      document.body.insertBefore(overlay, document.body.firstChild);
      // Foco al botón principal para accesibilidad
      var btn = document.getElementById('age-gate-confirm');
      if (btn) btn.focus();
    } else {
      document.addEventListener('DOMContentLoaded', mount);
    }
  }
  mount();

  // Confirmar
  overlay.addEventListener('click', function (e) {
    var target = e.target;
    if (target.id === 'age-gate-confirm') {
      setVerified();
      document.documentElement.style.overflow = '';
      overlay.remove();
      style.remove();
    }
    if (target.id === 'age-gate-decline') {
      window.location.href = '/index.html';
    }
  });

  // Tecla Escape = declinar
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.location.href = '/index.html';
    }
  });
}());
