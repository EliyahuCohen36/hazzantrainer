/* Keriah Trainer service worker: lets the app saved to the home screen work offline.
 *
 * - Pages: from the network when online (so every update shows at once, nothing to reinstall),
 *   from the cache when offline.
 * - The site's files (scripts, styles, fonts, pictures, data): from the cache, refreshed in the background.
 * - Recordings: from the network when online (so a recording the admin replaced is heard at once); a copy of each
 *   recording played is kept for offline (the link's token is ignored).
 * - Accounts and progress (Supabase): never cached; the app keeps unsent progress and sends it later.
 *
 * Bump VERSION only when this file's own rules change.
 */
const VERSION = "v2";
const PAGES = `kt-pages-${VERSION}`;
const FILES = `kt-files-${VERSION}`;
const AUDIO = `kt-audio-${VERSION}`;
const SCOPE = new URL(self.registration.scope).pathname; // "/hazzantrainer/"

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(PAGES).then((c) => c.add(SCOPE).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kt-") && ![PAGES, FILES, AUDIO].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isAudio = (url) => /\.(mp3|m4a|wav|webm)$/i.test(url.pathname);
const audioKey = (url) => url.origin + url.pathname.replace("/object/sign/", "/object/");

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Recordings (ours or Supabase storage)
  if (isAudio(url)) {
    e.respondWith(audio(req, url));
    return;
  }
  // Supabase API (accounts, progress, listings): always live.
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(req, { ignoreSearch: true })
            .then((r) => r || (url.pathname === SCOPE || url.pathname === SCOPE + "index.html" ? caches.match(SCOPE) : null))
            .then((r) => r || offlinePage()),
        ),
    );
    return;
  }

  // Everything else of ours: cache first, refresh in the background.
  e.respondWith(
    caches.open(FILES).then((c) =>
      c.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res.ok && res.status === 200) c.put(req, res.clone());
            return res;
          })
          .catch(() => hit || Response.error());
        if (hit) {
          e.waitUntil(net.catch(() => {}));
          return hit;
        }
        return net;
      }),
    ),
  );
});

async function audio(req, url) {
  const c = await caches.open(AUDIO);
  const key = audioKey(url);
  try {
    const res = await fetch(req);
    if (res.ok || res.status === 206) {
      // Keep a whole, fresh copy for offline (players ask for parts of the file), unless the kept one is the same file.
      c.match(key).then((old) => {
        const tag = res.headers.get("etag") || res.headers.get("last-modified");
        const oldTag = old && (old.headers.get("etag") || old.headers.get("last-modified"));
        if (old && tag && tag === oldTag) return;
        return fetch(url.href).then((full) => full.ok && full.status === 200 && c.put(key, full));
      }).catch(() => {});
      return res;
    }
    throw new Error(String(res.status));
  } catch (err) {
    const hit = await c.match(key);
    return hit ? ranged(req, hit) : new Response("", { status: 504 });
  }
}

// The admin replaced or removed a recording: forget this device's copy.
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "forget-audio" && e.data.path) {
    caches.open(AUDIO).then((c) =>
      c.keys().then((ks) => ks.forEach((k) => new URL(k.url).pathname.endsWith("/" + e.data.path) && c.delete(k))),
    );
  }
});

/** Answer a Range request from a whole cached file (Safari needs this to play audio). */
async function ranged(req, res) {
  const range = req.headers.get("range");
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const start = m && m[1] ? Number(m[1]) : 0;
  const end = m && m[2] ? Number(m[2]) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

function offlinePage() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Keriah Trainer</title>' +
      '<body style="font-family:system-ui;padding:2rem;text-align:center;color:#44403c"><h1>You are offline</h1>' +
      "<p>This page wasn't opened before, so it isn't saved on this device yet. Pages you have visited work offline.</p>" +
      `<p><a href="${SCOPE}">Back to the home page</a></p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
