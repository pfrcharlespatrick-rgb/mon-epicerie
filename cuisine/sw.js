/**
 * Service worker : rend Ma Cuisine utilisable sans réseau.
 *
 * Dans une cuisine, les mains sont grasses et le réseau parfois absent — la
 * recette doit s'ouvrir quand même. Le cache ne contient que les fichiers de
 * l'application ; le carnet et l'équipement vivent dans localStorage.
 *
 * Penser à incrémenter VERSION à chaque déploiement.
 */

const VERSION = 'v3';
const CACHE = `ma-cuisine-${VERSION}`;

/** Fichiers indispensables au premier affichage. */
const COQUILLE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/js/pieces.js',
  'assets/js/moteur.js',
  'assets/js/conseiller.js',
  'assets/js/app.js',
  'assets/icones/favicon.svg',
  'assets/icones/icone-192.png',
  'assets/icones/icone-512.png',
].map((chemin) => new URL(chemin, self.registration.scope).href);

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches
      .open(CACHE)
      // `cache: 'reload'` court-circuite le cache HTTP du navigateur, sans
      // quoi une nouvelle version se remplirait d'anciens fichiers.
      .then((cache) => cache.addAll(COQUILLE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((cle) => cle.startsWith('ma-cuisine-') && cle !== CACHE).map((cle) => caches.delete(cle))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;

  if (requete.method !== 'GET' || !requete.url.startsWith(self.registration.scope)) return;

  // Navigation : réseau d'abord pour les mises à jour, cache en filet.
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(requete, copie));
          return reponse;
        })
        .catch(() => caches.match(requete).then((cache) => cache ?? caches.match('./'))),
    );
    return;
  }

  // Ressources : cache de CETTE version uniquement, pour ne jamais mélanger
  // les générations de fichiers.
  evenement.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const enCache = await cache.match(requete);
      if (enCache) return enCache;

      const reponse = await fetch(requete);
      if (reponse.ok) cache.put(requete, reponse.clone());
      return reponse;
    }),
  );
});
