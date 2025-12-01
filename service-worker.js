const CACHE_NAME = "PWA_Practica_Final_v1";
const urlsToCache = [
    "./",
    "./index.html",
    "./css/bootstrap.min.css",
    "./css/fontawesome.min.css",
    "./css/style.css",
    "./webfonts/fa-brands-400.woff2",
    "./webfonts/fa-regular-400.woff2",
    "./webfonts/fa-solid-900.woff2",
    "./webfonts/fa-v4compatibility.woff2",
    "./js/jquery.min.js",
    "./js/jquery-ui.min.js",
    "./js/app.js",
    "./img/icon.png",
    "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
];

self.addEventListener("install", e => {

    e.waitUntil(

        caches.open(CACHE_NAME).then(cache => {

            return cache.addAll(urlsToCache);

        })

    );

});

self.addEventListener("activate", () => {

    console.log("Service Worker activado");

});

self.addEventListener("fetch", e => {

    e.respondWith(

        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })

    );

});