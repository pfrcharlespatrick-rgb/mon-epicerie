/**
 * Service worker : rend l'inventaire utilisable sans réseau.
 *
 * Au domaine, la connexion est rare et le comptage se fait un carnet à la
 * main, au fond d'un hangar — la page doit s'ouvrir quand même. Le cache ne
 * contient que les fichiers de l'application ; les décomptes et les archives
 * vivent dans localStorage.
 *
 * Penser à incrémenter VERSION à chaque déploiement.
 */

const VERSION = 'v4';
const CACHE = `lac-pere-${VERSION}`;

/** Fichiers indispensables au premier affichage. */
const COQUILLE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/js/catalogue.js',
  'assets/js/etat.js',
  'assets/js/rendu.js',
  'assets/js/analyseur.js',
  'assets/js/export.js',
  'assets/js/app.js',
  'assets/icones/favicon.svg',
  'assets/icones/icone-192.png',
  'assets/icones/icone-512.png',
  'assets/photos/chalets-du-domaine.jpg',
  'assets/photos/domaine-vue-aerienne.jpg',
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
        Promise.all(cles.filter((cle) => cle.startsWith('lac-pere-') && cle !== CACHE).map((cle) => caches.delete(cle))),
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
