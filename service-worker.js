/* Service worker de Mis Finanzas.
   Guarda una copia de la app en el teléfono para que funcione sin internet.
   Estrategia "primero la red": con internet siempre carga la versión más nueva
   (así ves tus cambios al publicar); sin internet usa la copia guardada.
   Si cambias la lista de archivos, sube el número de VERSION. */

const VERSION = 'v2';
const CACHE = 'mis-finanzas-' + VERSION;
const ARCHIVOS = [
  './',
  './index.html',
  './estilos.css',
  './app.js',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
  './iconos/icono-apple-180.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      })
      .catch(() =>
        caches.match(peticion, { ignoreSearch: true })
          .then((r) => r || (peticion.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then((r) => r || new Response('Sin conexión', { status: 503 }))
      )
  );
});
