// Se ejecuta solo en Vercel al publicar. Lee config.js y: rellena los textos legales,
// añade el código de AdSense a las páginas públicas y genera sitemap.xml, robots.txt y ads.txt.
import fs from "fs";
import path from "path";
const cfg = new Function("window", fs.readFileSync("config.js", "utf8") + ";return window.APP_CONFIG;")({});
const SITE = (cfg.SITE_URL || "").replace(/\/$/, "");
const client = /^ca-pub-\d+$/.test(cfg.ADSENSE_CLIENT || "") ? cfg.ADSENSE_CLIENT : "";
const now = new Date();
const vals = {
  "{{OWNER_NAME}}": cfg.OWNER_NAME || "",
  "{{CONTACT_EMAIL}}": cfg.CONTACT_EMAIL || "",
  "{{SITE_URL}}": SITE,
  "{{YEAR}}": String(now.getFullYear()),
  "{{DATE}}": now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
};
const adTag = client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>` : "";
const skip = new Set(["node_modules", ".git", "supabase", ".vercel"]);
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    if (skip.has(f)) continue;
    const p = path.join(d, f);
    fs.statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") && files.push(p);
  }
})(".");
const urls = [];
for (const f of files) {
  let h = fs.readFileSync(f, "utf8");
  for (const [k, v] of Object.entries(vals)) h = h.split(k).join(v);
  h = h.replace("<!--ADS-->", adTag);
  fs.writeFileSync(f, h);
  if (f !== "app.html") {
    const u = "/" + f.replace(/\\/g, "/").replace(/index\.html$/, "").replace(/\.html$/, "");
    urls.push(u === "/" ? "/" : u.replace(/\/$/, ""));
  }
}
fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${SITE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
if (client) fs.writeFileSync("ads.txt", `google.com, ${client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`);
if (/TU-DOMINIO|TU NOMBRE|tu@email/.test(JSON.stringify(cfg))) console.warn("AVISO: config.js aún tiene datos de ejemplo.");
console.log(`Listo: ${files.length} páginas, anuncios ${client ? "activados" : "desactivados"}.`);
