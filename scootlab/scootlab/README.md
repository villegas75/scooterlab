# ScootLab (web pública + app)

- **Web pública** (sin login, es donde van los anuncios): `index.html`, `tutoriales/`, `guia-seguridad`, `acerca`, `contacto`, `privacidad`, `terminos`.
- **App** (`app.html`, ruta `/app`): clips, reels, perfiles, seguidores. Usa Supabase. **No lleva anuncios** (tiene contenido de usuarios).

## 1. Supabase
1. Crea un proyecto en https://supabase.com.
2. **SQL Editor** → pega `supabase/schema.sql` → **Run**.
3. **Authentication → Providers → Email**: actívalo (puedes desactivar *Confirm email* para probar).

## 2. Rellena `config.js`
URL y clave anon de Supabase (*Project Settings → API*), tu dominio, tu nombre y tu email. Con eso se rellenan solas las páginas legales, el sitemap y robots.txt.

## 3. GitHub y Vercel
```bash
git init && git add . && git commit -m "ScootLab"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/scootlab.git
git push -u origin main
```
En Vercel: **Add New → Project** → importa el repo → Framework **Other** → **Deploy**. (`vercel.json` ya incluye el comando de build.)
Después, en **Settings → Domains** conecta tu dominio propio y en Supabase **Authentication → URL Configuration** añade ese dominio.

## 4. AdSense
1. Necesitas ser mayor de 18 años y tener tu **dominio propio** conectado.
2. Da de alta el sitio en https://adsense.google.com.
3. Copia tu ID (`ca-pub-…`) en `ADSENSE_CLIENT` de `config.js`, sube el cambio a GitHub y espera al nuevo despliegue. Se añade solo el código de AdSense a las páginas públicas y se genera `ads.txt`.
4. En AdSense, verifica el sitio y pide la revisión. Activa los **anuncios automáticos** y el mensaje de consentimiento (**Privacidad y mensajes**) para visitantes de la UE y el Reino Unido.
5. Google decide si te aprueba. Puede pedir más contenido original.

## Moderación
- Los usuarios denuncian clips con **Denunciar**. Las denuncias están en Supabase → **Table Editor → docs**, filtro `collection = reports`.
- Para retirar un clip: en esa misma tabla, borra la fila con `collection = clips` y el `id` denunciado (el panel de Supabase se salta las reglas).

## Importante
- Las páginas legales son plantillas: haz que las revise alguien con conocimientos legales de tu país.
- La clave `anon` es pública; nunca pongas la `service_role` en la web.
