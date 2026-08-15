/**
 * Service worker : rend l'application utilisable sans réseau.
 *
 * À l'épicerie, la connexion est souvent mauvaise — la liste doit s'ouvrir
 * quand même. Aucune donnée personnelle ne transite ici : le cache ne contient
 * que les fichiers de l'application, la liste elle-même vit dans localStorage.
 *
 * Penser à incrémenter VERSION à chaque déploiement pour que les anciens
 * fichiers soient remplacés.
 */

const VERSION = 'v3';
const CACHE = `mon-epicerie-${VERSION}`;

/** Fichiers indispensables au premier affichage. */
const COQUILLE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/js/app.js',
  'assets/js/catalogue.js',
  'assets/js/etat.js',
  'assets/js/rendu.js',
  'assets/js/export.js',
  'assets/icones/favicon.svg',
  'assets/icones/icone-192.png',
  'assets/icones/icone-512.png',
].map((chemin) => new URL(chemin, self.registration.scope).href);

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(COQUILLE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((cle) => cle !== CACHE).map((cle) => caches.delete(cle))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;

  if (requete.method !== 'GET' || !requete.url.startsWith(self.registration.scope)) return;

  // Navigation : on privilégie le réseau pour récupérer les mises à jour, avec
  // la page en cache comme filet de sécurité.
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

  // Ressources : réponse immédiate depuis le cache, rafraîchie en arrière-plan.
  evenement.respondWith(
    caches.match(requete).then((enCache) => {
      const reseau = fetch(requete)
        .then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE).then((cache) => cache.put(requete, copie));
          }
          return reponse;
        })
        .catch(() => enCache);

      return enCache ?? reseau;
    }),
  );
});
