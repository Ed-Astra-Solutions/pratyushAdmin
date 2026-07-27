/**
 * Pratyush Liftz website editor.
 *
 * A static page: every privileged action goes to the backend, which holds
 * the GitHub token and does the committing. Publishing writes
 * content/site.json to the site repo, and the website reads that file when
 * a visitor loads a page — so a publish is live within seconds.
 */
(() => {
  const CFG = window.PL_ADMIN_CONFIG || {};
  const S = window.PL_SCHEMA;
  const { icon, richText } = window.PL_UI;
  const API = (CFG.apiBase || '').replace(/\/$/, '');
  const SITE = (CFG.siteUrl || '').replace(/\/$/, '');
  const $ = (id) => document.getElementById(id);

  let token = sessionStorage.getItem('pl_token') || '';
  let content = null;      // working copy
  let baseline = '';       // JSON of the last published state
  let sha = null;          // git blob sha, so two people cannot overwrite each other
  let view = { section: 'blog', page: S.pages[0].id, post: null };
  const freshSteps = new Set();   // questions added since the page loaded

  /* ── api ─────────────────────────────────────────────────────── */

  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
    });
    const text = await res.text();
    const data = text && text[0] === '{' ? JSON.parse(text) : text;
    if (res.status === 401) { signOut(); throw new Error('Your session ended — please sign in again.'); }
    if (!res.ok) throw new Error((data && data.error) || `${res.status} ${res.statusText}`);
    return data;
  }

  /* ── signing in ──────────────────────────────────────────────── */

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('login-btn'), err = $('login-err');
    btn.disabled = true; btn.textContent = 'Signing in…'; err.classList.add('hidden');
    try {
      const r = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: $('user').value, password: $('pw').value }),
      });
      token = r.token;
      sessionStorage.setItem('pl_token', token);
      await start();
    } catch (e2) {
      err.textContent = e2.message; err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });

  function signOut() {
    token = ''; sessionStorage.removeItem('pl_token');
    $('shell').classList.add('hidden'); $('login').classList.remove('hidden');
  }
  $('logout').addEventListener('click', signOut);

  async function start() {
    const r = await api('/api/content');
    content = r.content; sha = r.sha;
    content.posts ??= [];
    baseline = JSON.stringify(content);
    $('login').classList.add('hidden');
    $('shell').classList.remove('hidden');
    $('view-site').href = SITE || '/';
    $('last-saved').textContent = content.updatedAt
      ? `Last published ${new Date(content.updatedAt).toLocaleString()}`
      : 'Nothing published yet';
    renderNav();
    render();
  }

  /* ── content helpers ─────────────────────────────────────────── */

  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), content);
  function set(path, value) {
    const parts = path.split('.'), last = parts.pop();
    let n = content; for (const p of parts) n = n[p] ??= {};
    n[last] = value;
  }

  const plain = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
  const slugify = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const today = () => new Date().toISOString().slice(0, 10);
  const isFile = (v) => /\.(mp4|webm|mov)(\?|$)/i.test(String(v ?? ''));

  function changed() {
    const d = JSON.stringify(content) !== baseline;
    $('save').disabled = !d;
    const pill = $('status');
    if (d) { pill.className = 'pill dirty'; pill.textContent = 'You have unpublished changes'; }
    else { pill.className = 'pill'; pill.textContent = 'Everything is published'; }
    return d;
  }

  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = `toast ${kind}`; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), kind === 'err' ? 9000 : 4500);
  }

  /** A yes/no question, in place of the browser's own grey box. */
  function confirmBox({ title, body, confirm = 'Delete', danger = true }) {
    return new Promise((resolve) => {
      const veil = document.createElement('div');
      veil.className = 'veil';
      veil.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">
        <h3></h3><p></p>
        <div class="acts">
          <button class="btn ghost" data-no>Cancel</button>
          <button class="btn ${danger ? 'danger' : ''}" data-yes></button>
        </div></div>`;
      veil.querySelector('h3').textContent = title;
      veil.querySelector('p').textContent = body;
      veil.querySelector('[data-yes]').textContent = confirm;
      const done = (v) => { veil.remove(); resolve(v); };
      veil.querySelector('[data-no]').onclick = () => done(false);
      veil.querySelector('[data-yes]').onclick = () => done(true);
      veil.onclick = (e) => { if (e.target === veil) done(false); };
      document.body.appendChild(veil);
      veil.querySelector('[data-yes]').focus();
    });
  }

  /* ── navigation ──────────────────────────────────────────────── */

  function renderNav() {
    const nav = $('nav');
    nav.innerHTML = '';
    for (const item of S.nav) {
      const b = document.createElement('button');
      b.innerHTML = `${icon(item.icon)}<span>${item.label}</span>`;
      b.className = item.id === view.section ? 'on' : '';
      b.onclick = () => { view = { ...view, section: item.id, post: null }; renderNav(); render(); };
      nav.appendChild(b);

      if (item.id === 'pages' && view.section === 'pages') {
        const sub = document.createElement('div');
        sub.className = 'subnav';
        for (const p of S.pages) {
          const s = document.createElement('button');
          s.textContent = p.label;
          s.className = p.id === view.page ? 'on' : '';
          s.onclick = () => { view.page = p.id; renderNav(); render(); };
          sub.appendChild(s);
        }
        nav.appendChild(sub);
      }
    }
  }

  function render() {
    const panel = $('panel');
    panel.innerHTML = '';
    window.scrollTo(0, 0);
    if (view.section === 'blog') return renderBlog(panel);
    if (view.section === 'form') return renderForm(panel);
    return renderPage(panel);
  }

  /* ── field widgets ───────────────────────────────────────────── */

  function label(text, hint) {
    const l = document.createElement('label');
    l.textContent = text;
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.appendChild(l);
    if (hint) { const h = document.createElement('p'); h.className = 'hint'; h.textContent = hint; wrap.dataset.hint = '1'; wrap._hint = h; }
    return wrap;
  }

  /**
   * One labelled input. `read`/`write` keep the widget away from where the
   * value actually lives, so the same code serves site copy, list items and
   * blog posts.
   */
  function field(spec, read, write) {
    const wrap = label(spec.label, spec.hint);
    const value = read();
    const done = (v) => { write(v); changed(); };

    if (spec.type === 'rich' || spec.type === 'long') {
      const rt = richText({ value, multiline: false, placeholder: spec.placeholder || '', onInput: done });
      if (spec.type === 'long') rt.querySelector('.rt').style.minHeight = '92px';
      wrap.appendChild(rt);
    } else if (spec.type === 'list') {
      wrap.appendChild(listRows(read() || [], write));
    } else if (spec.type === 'image') {
      wrap.appendChild(picture(value, done));
    } else if (spec.type === 'bool') {
      wrap.querySelector('label').remove();
      wrap.appendChild(toggle(spec.label, !!value, done));
    } else if (spec.type === 'date') {
      const i = document.createElement('input');
      i.type = 'date'; i.value = value || '';
      i.oninput = () => done(i.value);
      wrap.appendChild(i);
    } else if (spec.type === 'select') {
      const s = document.createElement('select');
      for (const o of spec.options) {
        const op = document.createElement('option');
        op.value = o.value; op.textContent = o.label;
        if (o.value === value) op.selected = true;
        s.appendChild(op);
      }
      s.onchange = () => done(s.value);
      wrap.appendChild(s);
    } else {
      const i = document.createElement('input');
      i.type = 'text'; i.value = value ?? '';
      if (spec.placeholder) i.placeholder = spec.placeholder;
      i.oninput = () => done(i.value);
      wrap.appendChild(i);
    }
    if (wrap._hint) wrap.appendChild(wrap._hint);
    return wrap;
  }

  /** A field straight out of site.json, addressed by its dotted key. */
  const contentField = (spec) => field(spec, () => get(spec.key), (v) => set(spec.key, v));

  function toggle(text, on, onChange) {
    const l = document.createElement('label');
    l.className = 'switch';
    const i = document.createElement('input');
    i.type = 'checkbox'; i.checked = on;
    const t = document.createElement('span');
    t.className = 'track';
    const s = document.createElement('span');
    s.textContent = text;
    i.onchange = () => onChange(i.checked);
    l.append(i, t, s);
    return l;
  }

  function listRows(items, write) {
    const box = document.createElement('div');
    box.className = 'rows';
    const draw = () => {
      box.innerHTML = '';
      items.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        const input = document.createElement('input');
        input.type = 'text'; input.value = plain(item);
        input.oninput = () => { items[i] = input.value; write(items); changed(); };
        const del = document.createElement('button');
        del.className = 'btn quiet sm';
        del.innerHTML = icon('trash');
        del.title = 'Remove this line';
        del.onclick = () => { items.splice(i, 1); write(items); changed(); draw(); };
        row.append(input, del);
        box.appendChild(row);
      });
      const add = document.createElement('button');
      add.className = 'btn ghost sm add';
      add.innerHTML = `${icon('plus')} Add a line`;
      add.onclick = () => { items.push(''); write(items); changed(); draw(); };
      box.appendChild(add);
    };
    draw();
    return box;
  }

  /* ── pictures ────────────────────────────────────────────────── */

  /** Uploads a file and returns its path on the site, or null. */
  async function upload(file) {
    if (!file) return null;
    if (file.size > 8 * 1024 * 1024) {
      toast('That file is over 8 MB. Please make it smaller and try again.', 'err');
      return null;
    }
    try {
      const b64 = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result).split(',')[1]);
        fr.onerror = rej; fr.readAsDataURL(file);
      });
      const r = await api('/api/images', { method: 'POST', body: JSON.stringify({ filename: file.name, contentBase64: b64 }) });
      toast('Photo uploaded.', 'ok');
      return r.path;
    } catch (e) { toast(e.message, 'err'); return null; }
  }

  /** Opens the file picker and uploads whatever is chosen. */
  function pickFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = async () => resolve(await upload(input.files[0]));
      input.click();
    });
  }

  function picture(path, onChange) {
    const box = document.createElement('div');
    box.className = 'pic';

    const draw = (p) => {
      box.classList.toggle('has', !!p);
      box.innerHTML = '';
      if (p) {
        const img = document.createElement('img');
        img.src = `${SITE}/${String(p).replace(/^\//, '')}`;
        img.alt = '';
        img.onerror = () => { img.style.display = 'none'; };
        box.appendChild(img);
      } else {
        const e = document.createElement('div');
        e.className = 'empty';
        e.innerHTML = `${icon('image', 26)}<span>Drag a photo here, or choose one from your computer</span>`;
        box.appendChild(e);
      }
      const acts = document.createElement('div');
      acts.className = 'acts';
      const choose = document.createElement('button');
      choose.className = 'btn ghost sm';
      choose.textContent = p ? 'Replace photo' : 'Choose photo';
      choose.onclick = async () => {
        choose.disabled = true; choose.textContent = 'Uploading…';
        const np = await pickFile();
        choose.disabled = false;
        if (np) { onChange(np); draw(np); } else draw(p);
      };
      acts.appendChild(choose);
      if (p) {
        const rm = document.createElement('button');
        rm.className = 'btn quiet sm';
        rm.textContent = 'Remove';
        rm.onclick = () => { onChange(''); draw(''); };
        acts.appendChild(rm);
      }
      box.appendChild(acts);
    };

    box.addEventListener('dragover', (e) => { e.preventDefault(); box.classList.add('drag'); });
    box.addEventListener('dragleave', () => box.classList.remove('drag'));
    box.addEventListener('drop', async (e) => {
      e.preventDefault(); box.classList.remove('drag');
      const np = await upload(e.dataTransfer.files[0]);
      if (np) { onChange(np); draw(np); }
    });

    draw(path);
    return box;
  }

  /* ── expandable list items, shared by results / faqs / questions ── */

  function itemCard({ index, total, title, subtitle, body, onMove, onDelete, deleteLabel }) {
    const card = document.createElement('div');
    card.className = 'item';

    const head = document.createElement('div');
    head.className = 'item-head';
    head.innerHTML = `<span class="num">${index + 1}</span>`;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = title || '—';
    head.appendChild(name);
    if (subtitle) {
      const s = document.createElement('span');
      s.className = 'pill';
      s.textContent = subtitle;
      head.appendChild(s);
    }
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.innerHTML = icon('chev');
    head.appendChild(chev);
    card.appendChild(head);

    const inner = document.createElement('div');
    inner.className = 'item-body hidden';
    card.appendChild(inner);

    const acts = document.createElement('div');
    acts.className = 'item-acts';
    const mk = (ico, text, title2, fn, disabled) => {
      const b = document.createElement('button');
      b.className = 'btn quiet sm';
      b.innerHTML = `${icon(ico)} ${text}`;
      b.title = title2;
      b.disabled = disabled;
      b.onclick = fn;
      return b;
    };
    acts.append(
      mk('up', 'Move up', 'Move up', () => onMove(-1), index === 0),
      mk('down', 'Move down', 'Move down', () => onMove(1), index === total - 1),
    );
    const spacer = document.createElement('span');
    spacer.className = 'spacer';
    acts.appendChild(spacer);
    const del = document.createElement('button');
    del.className = 'btn danger sm';
    del.innerHTML = `${icon('trash')} ${deleteLabel || 'Delete'}`;
    del.onclick = onDelete;
    acts.appendChild(del);
    inner.appendChild(acts);

    // The fields are built the first time the item is opened, so a long list
    // costs nothing until you actually look inside one.
    let built = false;
    head.onclick = () => {
      if (!built) { inner.insertBefore(body(name), acts); built = true; }
      const open = card.classList.toggle('open');
      inner.classList.toggle('hidden', !open);
    };

    return card;
  }

  /* ── website text ────────────────────────────────────────────── */

  function renderPage(panel) {
    const page = S.pages.find((p) => p.id === view.page) || S.pages[0];
    $('section-title').textContent = page.label;
    if (page.blurb) {
      const p = document.createElement('p');
      p.className = 'intro';
      p.textContent = page.blurb;
      panel.appendChild(p);
    }
    for (const card of page.cards) {
      const box = document.createElement('div');
      box.className = 'card';
      const h = document.createElement('h3');
      h.textContent = card.title;
      box.appendChild(h);
      if (card.sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = card.sub; box.appendChild(s); }
      for (const f of card.fields) box.appendChild(contentField(f));
      panel.appendChild(box);
    }
    for (const name of page.collections || []) panel.appendChild(collection(name));
  }

  function collection(name) {
    const def = S.collections[name];
    const items = (content[name] ??= []);
    const box = document.createElement('div');
    box.className = 'card';
    const h = document.createElement('h3');
    h.textContent = `${def.label} (${items.length})`;
    box.appendChild(h);
    if (def.blurb) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = def.blurb; box.appendChild(s); }

    items.forEach((item, i) => {
      box.appendChild(itemCard({
        index: i, total: items.length,
        title: plain(item[def.titleField]),
        body: (nameEl) => {
          const frag = document.createDocumentFragment();
          for (const f of def.fields) {
            frag.appendChild(field(f, () => item[f.key], (v) => {
              item[f.key] = v;
              // Whether a clip is an embed or an uploaded file is obvious from
              // the link, so nobody is asked to choose.
              if (f.key === 'video') item.videoType = isFile(v) ? 'file' : 'embed';
              if (f.key === 'src') item.type = isFile(v) ? 'file' : 'embed';
              if (f.key === def.titleField) nameEl.textContent = plain(v) || '—';
            }));
          }
          return frag;
        },
        onMove: (d) => { items.splice(i + d, 0, items.splice(i, 1)[0]); changed(); render(); },
        onDelete: async () => {
          const label2 = plain(item[def.titleField]) || `this ${def.one}`;
          if (!await confirmBox({ title: `Delete ${label2}?`, body: 'It will disappear from your website when you next publish.' })) return;
          items.splice(i, 1); changed(); render();
        },
      }));
    });

    const add = document.createElement('button');
    add.className = 'btn ghost sm add';
    add.innerHTML = `${icon('plus')} Add a ${def.one}`;
    add.onclick = () => { items.push(structuredClone(def.blank)); changed(); render(); };
    box.appendChild(add);
    return box;
  }

  /* ── blog ────────────────────────────────────────────────────── */

  function renderBlog(panel) {
    if (view.post !== null) return renderPostEditor(panel);
    $('section-title').textContent = 'Blog posts';

    const posts = content.posts;
    const bar = document.createElement('div');
    bar.className = 'editor-top';
    const intro = document.createElement('p');
    intro.className = 'intro';
    intro.style.margin = '0';
    intro.textContent = posts.length
      ? 'Newest first, the same order they appear on your website.'
      : '';
    const spacer = document.createElement('span');
    spacer.className = 'spacer';
    const add = document.createElement('button');
    add.className = 'btn';
    add.innerHTML = `${icon('plus')} Write a new post`;
    add.onclick = () => {
      posts.unshift({
        slug: '', title: '', tag: '', date: today(), status: 'draft',
        excerpt: '', cover: '', coverAlt: '', body: '', url: '',
      });
      view.post = posts[0];
      changed(); render();
    };
    bar.append(intro, spacer, add);
    panel.appendChild(bar);

    if (!posts.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<h3>No posts yet</h3><p>Write your first article and it appears on your blog page as soon as you publish.</p>`;
      const b = document.createElement('button');
      b.className = 'btn';
      b.innerHTML = `${icon('plus')} Write a new post`;
      b.onclick = add.onclick;
      empty.appendChild(b);
      panel.appendChild(empty);
      return;
    }

    const ordered = [...posts].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    for (const post of ordered) panel.appendChild(postRow(post));
  }

  function postRow(post) {
    const row = document.createElement('div');
    row.className = 'post-row';

    if (post.cover) {
      const img = document.createElement('img');
      img.className = 'cov';
      img.src = `${SITE}/${String(post.cover).replace(/^\//, '')}`;
      img.alt = '';
      row.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'cov none';
      ph.innerHTML = icon('image', 20);
      row.appendChild(ph);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const b = document.createElement('b');
    b.textContent = plain(post.title) || 'Untitled post';
    const s = document.createElement('span');
    s.textContent = [post.tag, post.date ? new Date(post.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' } ) : 'No date',
      String(post.body || '').trim() ? '' : 'Nothing written yet'].filter(Boolean).join(' · ');
    meta.append(b, s);
    row.appendChild(meta);

    const pill = document.createElement('span');
    pill.className = `pill ${post.status === 'draft' ? 'draft' : 'live'}`;
    pill.textContent = post.status === 'draft' ? 'Draft' : 'On the website';
    row.appendChild(pill);

    const acts = document.createElement('div');
    acts.className = 'acts';
    const edit = document.createElement('button');
    edit.className = 'btn ghost sm';
    edit.textContent = 'Edit';
    edit.onclick = () => { view.post = post; render(); };
    const del = document.createElement('button');
    del.className = 'btn quiet sm';
    del.innerHTML = icon('trash');
    del.title = 'Delete this post';
    del.onclick = async () => {
      if (!await confirmBox({
        title: `Delete "${plain(post.title) || 'Untitled post'}"?`,
        body: 'The post and everything written in it will be gone once you publish.',
      })) return;
      content.posts.splice(content.posts.indexOf(post), 1);
      changed(); render();
    };
    acts.append(edit, del);
    row.appendChild(acts);
    return row;
  }

  function renderPostEditor(panel) {
    const post = view.post;
    $('section-title').textContent = plain(post.title) || 'New post';

    const top = document.createElement('div');
    top.className = 'editor-top';
    const back = document.createElement('button');
    back.className = 'btn ghost sm';
    back.innerHTML = `${icon('back')} All posts`;
    back.onclick = () => { view.post = null; render(); };
    const spacer = document.createElement('span');
    spacer.className = 'spacer';
    top.append(back, spacer);

    const status = toggle('Show this post on my website', post.status !== 'draft', (on) => {
      post.status = on ? 'published' : 'draft';
      changed();
    });
    top.appendChild(status);
    panel.appendChild(top);

    /* Title, and the web address that follows from it. */
    const head = document.createElement('div');
    head.className = 'card';
    const title = document.createElement('input');
    title.className = 'title-in';
    title.placeholder = 'Post title';
    title.value = plain(post.title);
    const slugLine = document.createElement('p');
    slugLine.className = 'slug';
    const drawSlug = () => {
      slugLine.innerHTML = '';
      const txt = document.createElement('span');
      txt.textContent = 'Web address:';
      const code = document.createElement('code');
      code.textContent = `/blog/post/?s=${post.slug || '…'}`;
      const edit = document.createElement('button');
      edit.className = 'btn quiet sm';
      edit.textContent = 'Change';
      edit.onclick = () => {
        const v = prompt('Web address for this post.\n\nLowercase letters, numbers and hyphens only.', post.slug);
        if (v == null) return;
        post.slug = slugify(v);
        changed(); drawSlug();
      };
      slugLine.append(txt, code, edit);
    };
    // The address follows the title until it is changed by hand.
    title.oninput = () => {
      const autoFollow = !post.slug || post.slug === slugify(post.title);
      post.title = title.value;
      if (autoFollow) post.slug = slugify(title.value);
      $('section-title').textContent = plain(post.title) || 'New post';
      drawSlug(); changed();
    };
    drawSlug();
    head.append(title, slugLine);
    panel.appendChild(head);

    /* Cover photo. */
    const cover = document.createElement('div');
    cover.className = 'card';
    cover.innerHTML = '<h3>Cover photo</h3><p class="sub">Shown on the blog page and at the top of the post. Landscape photos look best.</p>';
    cover.appendChild(picture(post.cover, (p) => { post.cover = p; changed(); }));
    cover.appendChild(field({ label: 'Describe the photo in a few words', type: 'text', hint: 'Helps Google, and anyone using a screen reader.' },
      () => post.coverAlt, (v) => { post.coverAlt = v; }));
    panel.appendChild(cover);

    /* Details. */
    const details = document.createElement('div');
    details.className = 'card';
    details.innerHTML = '<h3>Details</h3>';
    const two = document.createElement('div');
    two.className = 'two';
    two.appendChild(field({ label: 'Category', type: 'text', placeholder: 'Nutrition, Training, Mindset…' },
      () => post.tag, (v) => { post.tag = v; }));
    two.appendChild(field({ label: 'Date', type: 'date' }, () => post.date, (v) => { post.date = v; }));
    details.appendChild(two);
    details.appendChild(field({ label: 'Short summary', type: 'long', hint: 'One or two sentences. This is the teaser on the blog page.' },
      () => post.excerpt, (v) => { post.excerpt = v; }));
    panel.appendChild(details);

    /* The article itself. */
    const bodyCard = document.createElement('div');
    bodyCard.className = 'card';
    bodyCard.innerHTML = '<h3>The article</h3><p class="sub">Write it the way you want it to read. Use the buttons above the box for headings, lists, links and photos.</p>';
    bodyCard.appendChild(richText({
      value: post.body, multiline: true,
      placeholder: 'Start writing…',
      onInput: (html) => { post.body = html; changed(); },
      onImage: pickFile,
    }));
    panel.appendChild(bodyCard);

    /* Sending readers somewhere else instead. */
    const adv = document.createElement('div');
    adv.className = 'card';
    adv.innerHTML = '<h3>Or link somewhere else</h3><p class="sub">Leave this empty unless the article lives on another website. If you fill it in, the card links there instead of opening the post above.</p>';
    adv.appendChild(field({ label: 'Link', type: 'text', placeholder: 'https://…' }, () => post.url, (v) => { post.url = v; }));
    panel.appendChild(adv);

    const bottom = document.createElement('div');
    bottom.className = 'editor-top';
    const back2 = document.createElement('button');
    back2.className = 'btn ghost';
    back2.innerHTML = `${icon('back')} All posts`;
    back2.onclick = back.onclick;
    const sp = document.createElement('span');
    sp.className = 'spacer';
    const note = document.createElement('span');
    note.className = 'hint';
    note.style.color = 'var(--dim)';
    note.textContent = 'Your writing is kept as you type — press Publish changes when you are ready for it to go live.';
    bottom.append(back2, sp, note);
    panel.appendChild(bottom);
  }

  /* ── application form ────────────────────────────────────────── */

  function renderForm(panel) {
    $('section-title').textContent = 'Application form';
    const intro = document.createElement('p');
    intro.className = 'intro';
    intro.textContent = 'The questions people answer when they apply for coaching. Changes go live on your website as soon as you publish.';
    panel.appendChild(intro);

    const steps = (content.applyForm.steps ??= []);
    const box = document.createElement('div');
    box.className = 'card';
    const h = document.createElement('h3');
    h.textContent = `Questions (${steps.length})`;
    box.appendChild(h);

    steps.forEach((step, i) => {
      box.appendChild(itemCard({
        index: i, total: steps.length,
        title: plain(step.question),
        subtitle: (S.questionTypes.find((t) => t.value === step.type) || {}).label,
        body: (nameEl) => questionBody(step, nameEl),
        onMove: (d) => { steps.splice(i + d, 0, steps.splice(i, 1)[0]); changed(); render(); },
        onDelete: async () => {
          if (!await confirmBox({
            title: `Delete "${plain(step.question)}"?`,
            body: 'Applications already received keep their answers. Only the form changes.',
          })) return;
          steps.splice(i, 1); changed(); render();
        },
        deleteLabel: 'Delete question',
      }));
    });

    const add = document.createElement('button');
    add.className = 'btn ghost sm add';
    add.innerHTML = `${icon('plus')} Add a question`;
    add.onclick = () => {
      const step = {
        id: `question${steps.length + 1}`, type: 'single', question: 'Your new question',
        required: true, options: ['First answer', 'Second answer'],
      };
      freshSteps.add(step);
      steps.push(step);
      changed(); render();
    };
    box.appendChild(add);
    panel.appendChild(box);

    for (const card of S.formScreens) {
      const c = document.createElement('div');
      c.className = 'card';
      const t = document.createElement('h3');
      t.textContent = card.title;
      c.appendChild(t);
      if (card.sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = card.sub; c.appendChild(s); }
      for (const f of card.fields) c.appendChild(contentField(f));
      panel.appendChild(c);
    }
  }

  function questionBody(step, nameEl) {
    const frag = document.createDocumentFragment();

    frag.appendChild(field({ label: 'Question', type: 'rich' }, () => step.question, (v) => {
      step.question = v;
      nameEl.textContent = plain(v) || '—';
      // A brand-new question gets its export label from its wording. Existing
      // ones keep theirs, so past applications stay readable.
      if (freshSteps.has(step)) step.id = exportKey(v, step);
    }));

    frag.appendChild(field({ label: 'Helper text under the question', type: 'rich', placeholder: 'Optional' },
      () => step.description || '', (v) => { step.description = v; }));

    const kind = label('How should they answer?');
    const chips = document.createElement('div');
    chips.className = 'choice';
    const hint = document.createElement('p');
    hint.className = 'hint';
    for (const t of S.questionTypes) {
      const b = document.createElement('button');
      b.textContent = t.label;
      b.className = step.type === t.value ? 'on' : '';
      b.onclick = () => {
        step.type = t.value;
        if ((t.value === 'single' || t.value === 'multi') && !step.options?.length) {
          step.options = ['First answer', 'Second answer'];
        }
        changed(); render();
      };
      chips.appendChild(b);
    }
    hint.textContent = (S.questionTypes.find((t) => t.value === step.type) || {}).hint || '';
    kind.append(chips, hint);
    frag.appendChild(kind);

    if (step.type === 'single' || step.type === 'multi') frag.appendChild(answerOptions(step));
    if (step.type === 'text') {
      frag.appendChild(field({ label: 'Faint example text in the box', type: 'text', placeholder: 'Your answer here…' },
        () => step.placeholder || '', (v) => { step.placeholder = v; }));
    }
    if (step.type === 'contact') {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = `Collects: ${(step.fields || []).map((f) => f.label).join(', ')}.`;
      frag.appendChild(p);
    }

    const req = document.createElement('div');
    req.className = 'field';
    req.appendChild(toggle('They have to answer this before moving on', !!step.required, (v) => { step.required = v; changed(); }));
    frag.appendChild(req);

    return frag;
  }

  /** A safe, unique export label derived from the question's wording. */
  function exportKey(question, step) {
    const base = plain(question).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || 'question';
    const taken = new Set(content.applyForm.steps.filter((s) => s !== step).map((s) => s.id));
    let key = base, n = 2;
    while (taken.has(key)) key = `${base}_${n++}`;
    return key;
  }

  function answerOptions(step) {
    const wrap = label('Answers they can choose from');
    const rows = document.createElement('div');
    rows.className = 'rows';

    const draw = () => {
      rows.innerHTML = '';
      (step.options ??= []).forEach((opt, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        const input = document.createElement('input');
        input.type = 'text'; input.value = opt;
        input.oninput = () => {
          if (step.disqualifyOn === step.options[i]) step.disqualifyOn = input.value;
          step.options[i] = input.value;
          changed();
        };
        row.appendChild(input);

        // Marking an answer as ending the form sends that person straight to
        // the polite exit screen instead of the rest of the questions.
        const isEnd = step.disqualifyOn === step.options[i];
        const end = document.createElement('button');
        end.className = `btn sm ${isEnd ? '' : 'ghost'}`;
        end.textContent = isEnd ? 'Ends the form' : 'End here';
        end.title = 'Send anyone choosing this answer to the polite exit screen';
        end.onclick = () => {
          if (isEnd) delete step.disqualifyOn; else step.disqualifyOn = step.options[i];
          changed(); draw();
        };
        row.appendChild(end);

        const del = document.createElement('button');
        del.className = 'btn quiet sm';
        del.innerHTML = icon('trash');
        del.title = 'Remove this answer';
        del.onclick = () => {
          if (step.disqualifyOn === step.options[i]) delete step.disqualifyOn;
          step.options.splice(i, 1); changed(); draw();
        };
        row.appendChild(del);
        rows.appendChild(row);
      });

      const add = document.createElement('button');
      add.className = 'btn ghost sm add';
      add.innerHTML = `${icon('plus')} Add an answer`;
      add.onclick = () => { step.options.push('New answer'); changed(); draw(); };
      rows.appendChild(add);
    };
    draw();
    wrap.appendChild(rows);
    return wrap;
  }

  /* ── publishing ──────────────────────────────────────────────── */

  $('save').addEventListener('click', async () => {
    const btn = $('save'), pill = $('status');

    // Catch the two mistakes the backend would otherwise bounce, in words
    // that say what to do about them.
    const bad = content.posts.find((p) => !plain(p.title));
    if (bad) { toast('One of your posts has no title yet. Give it a title, then publish.', 'err'); return; }
    for (const p of content.posts) if (!p.slug) p.slug = slugify(p.title);

    btn.disabled = true; btn.textContent = 'Publishing…';
    try {
      const r = await api('/api/content', {
        method: 'PUT',
        body: JSON.stringify({ content, sha, message: 'admin: update site content' }),
      });
      sha = r.sha;
      content.updatedAt = r.updatedAt;
      baseline = JSON.stringify(content);
      pill.className = 'pill ok'; pill.textContent = 'Published';
      $('last-saved').textContent = `Last published ${new Date(r.updatedAt).toLocaleString()}`;
      toast('Published. Your website is up to date.', 'ok');
      setTimeout(changed, 2500);
    } catch (e) {
      pill.className = 'pill err'; pill.textContent = 'Could not publish';
      toast(e.message, 'err');
      changed();
    } finally {
      btn.textContent = 'Publish changes';
      btn.disabled = false;
    }
  });

  addEventListener('beforeunload', (e) => {
    if (content && JSON.stringify(content) !== baseline) { e.preventDefault(); e.returnValue = ''; }
  });

  // Pick up an existing session if the token is still good.
  if (token) start().catch(() => signOut());
})();
