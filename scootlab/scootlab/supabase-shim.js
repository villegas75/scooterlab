// Conecta la app con Supabase: login, base de datos (tabla "docs") y almacenamiento (bucket "uploads").
(function () {
  const cfg = window.APP_CONFIG || {};
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  window.sb = sb;
  let sess = null;
  const uid = () => sess && sess.user.id;
  const ready = sb.auth.getSession().then(r => { sess = r.data.session; });

  const coll = name => ({
    doc: id => ({
      set: async data => {
        const { error } = await sb.from("docs").upsert({ collection: name, id, data, owner: uid() }, { onConflict: "collection,id" });
        if (error) throw error;
      },
      delete: async () => {
        const { error } = await sb.from("docs").delete().eq("collection", name).eq("id", id);
        if (error) throw error;
      }
    }),
    onSnapshot: (cb, err) => {
      const load = async () => {
        const { data, error } = await sb.from("docs").select("id,data").eq("collection", name);
        if (error) { err && err(error); return; }
        cb({ docs: data.map(r => ({ id: r.id, data: () => r.data })) });
      };
      load();
      const ch = sb.channel("c-" + name + "-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: "collection=eq." + name }, load)
        .subscribe();
      return () => sb.removeChannel(ch);
    }
  });

  const assetsApi = {
    upload: async f => {
      const ext = ((f.name || "").split(".").pop() || (f.type || "").split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin";
      const path = uid() + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      const { error } = await sb.storage.from("uploads").upload(path, f, { contentType: f.type || undefined });
      if (error) throw error;
      return { id: path, url: sb.storage.from("uploads").getPublicUrl(path).data.publicUrl };
    }
  };

  window.claude = {
    use: async n => {
      await ready;
      if (!sess) return null;
      if (n === "db") return { collection: coll };
      if (n === "assets") return assetsApi;
      if (n === "user") return { id: async () => uid() };
      return null;
    }
  };

  function box(html) {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;inset:0;z-index:999;background:#000;color:#fff;display:grid;place-items:center;padding:20px;font-family:system-ui,sans-serif";
    d.innerHTML = '<div style="max-width:340px;width:100%">' + html + "</div>";
    document.body.appendChild(d);
    return d;
  }
  function showLogin() {
    const st = "width:100%;padding:12px;margin:0 0 8px;border-radius:10px;border:1px solid #3a3a3a;background:#000;color:#fff;font-size:16px;box-sizing:border-box";
    const bt = "padding:11px 16px;border-radius:12px;border:0;font-weight:700;font-size:15px;margin-right:8px;";
    const d = box('<h1 style="margin:0 0 4px">Scoot<span style="opacity:.8">Lab</span></h1><p style="color:#a8a8a8;margin:0 0 16px">Entra para ver y subir clips.</p>' +
      '<input id="le" type="email" placeholder="Email" style="' + st + '"><input id="lp" type="password" placeholder="Contraseña (mín. 6 caracteres)" style="' + st + '">' +
      '<button id="lin" style="' + bt + 'background:#fff;color:#000">Entrar</button><button id="lup" style="' + bt + 'background:#1a1a1a;color:#fff">Crear cuenta</button><p id="lm" style="color:#a8a8a8;font-size:14px"></p>');
    const cx = document.createElement("button");
    cx.textContent = "Cerrar";
    cx.style.cssText = "margin-top:12px;background:none;border:0;color:#a8a8a8;font-size:14px;text-decoration:underline";
    cx.onclick = () => d.remove();
    d.firstChild.appendChild(cx);
    const msg = t => { d.querySelector("#lm").textContent = t; };
    const vals = () => [d.querySelector("#le").value.trim(), d.querySelector("#lp").value];
    d.querySelector("#lin").onclick = async () => {
      const [email, password] = vals();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) msg("No se pudo entrar: " + error.message); else location.reload();
    };
    d.querySelector("#lup").onclick = async () => {
      const [email, password] = vals();
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) msg("No se pudo crear la cuenta: " + error.message);
      else if (data.session) location.reload();
      else msg("Cuenta creada. Revisa tu email para confirmarla y vuelve a entrar.");
    };
  }
  function showLogout() {
    const b = document.createElement("button");
    b.textContent = "Salir";
    b.style.cssText = "position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:50;background:#1a1a1a;color:#fff;border:0;border-radius:10px;padding:6px 10px;font-size:13px";
    b.onclick = async () => { await sb.auth.signOut(); location.reload(); };
    document.body.appendChild(b);
  }
  function showLoginBtn() {
    const b = document.createElement("button");
    b.textContent = "Entrar";
    b.style.cssText = "position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:50;background:#fff;color:#000;border:0;border-radius:10px;padding:6px 12px;font-size:13px;font-weight:700";
    b.onclick = showLogin;
    document.body.appendChild(b);
  }
  ready.then(() => { if (!sess) showLoginBtn(); else showLogout(); });
})();
