/**
 * The bits of the console that people actually type into: icons, the
 * rich-text box, and the cleaner that decides which markup is allowed to
 * reach the website.
 *
 * Text is edited the way it looks on the site — bold is bold, a heading is
 * a heading — so nobody has to know what a tag is. Everything typed here
 * ends up in content/site.json, and the backend rejects anything unsafe, so
 * the cleaner below keeps the output inside those bounds.
 */
window.PL_UI = (() => {

  /* ── icons ───────────────────────────────────────────────────── */

  const ICONS = {
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    page: '<path d="M4 3h9l7 7v11a0 0 0 0 1 0 0H4Z"/><path d="M13 3v7h7"/><path d="M8 14h8M8 17h5"/>',
    form: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 9h4M7 13h10M7 17h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    grab: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-6 6-2-2-5 5"/>',
    bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7Zm0 7h7a3.5 3.5 0 0 1 0 7H7Z"/>',
    italic: '<path d="M15 5h-5M14 19H9M14 5l-4 14"/>',
    h2: '<path d="M4 6v12M11 6v12M4 12h7M15 18c0-3 4-3.6 4-6a2 2 0 0 0-4 0"/><path d="M15 18h5"/>',
    h3: '<path d="M4 6v12M11 6v12M4 12h7M15 7h4l-2.5 4A2.5 2.5 0 1 1 15 15"/>',
    ul: '<circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/><path d="M10 7h10M10 12h10M10 17h10"/>',
    ol: '<path d="M5 6h1v4M4 18h3M4 15c0-1 3-1 3 0s-3 1.5-3 3h3"/><path d="M11 7h9M11 12h9M11 17h9"/>',
    quote: '<path d="M8 7c-2.5 0-4 1.8-4 4s1.6 3.5 3.5 3.5S11 13 11 11c0-2.5-1.5-4-3-4Zm0 0 2-3M18 7c-2.5 0-4 1.8-4 4s1.6 3.5 3.5 3.5S21 13 21 11c0-2.5-1.5-4-3-4Zm0 0 2-3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    rule: '<path d="M4 12h16"/>',
    clear: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  };

  const icon = (name, size = 16) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ── the cleaner ─────────────────────────────────────────────── */
  /* Pasting from Word or a website drags a lot of markup along. Only the
     tags the site knows how to style survive, and only with the attributes
     the backend allows. */

  const BLOCK_TAGS = {
    P: [], BR: [], B: [], STRONG: [], I: [], EM: [], U: [],
    H2: [], H3: [], UL: [], OL: [], LI: [], BLOCKQUOTE: [], HR: [],
    A: ['href', 'target', 'rel'], IMG: ['src', 'alt'],
  };
  const INLINE_TAGS = { B: [], STRONG: [], I: [], EM: [], BR: [], A: ['href', 'target', 'rel'] };

  const SAFE_URL = /^(https?:\/\/|mailto:|\/|#)/i;
  /** Tags whose contents go too — script text is not copy. */
  const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'BASE',
    'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'NOSCRIPT', 'TEMPLATE', 'META', 'TITLE']);

  function cleanNode(node, allowed, out) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) { out.appendChild(child.cloneNode()); continue; }
      if (child.nodeType !== 1) continue;

      const tag = child.tagName;
      if (DROP.has(tag)) continue;
      const attrs = allowed[tag];
      if (!attrs) {                       // unknown wrapper: keep the contents
        cleanNode(child, allowed, out);
        continue;
      }
      if ((tag === 'A' || tag === 'IMG') && !SAFE_URL.test(child.getAttribute(tag === 'A' ? 'href' : 'src') || '')) {
        cleanNode(child, allowed, out);
        continue;
      }
      const copy = document.createElement(tag);
      for (const a of attrs) {
        const v = child.getAttribute(a);
        if (v) copy.setAttribute(a, v);
      }
      if (tag === 'A') { copy.target = '_blank'; copy.rel = 'noopener'; }
      cleanNode(child, allowed, copy);
      out.appendChild(copy);
    }
  }

  function clean(html, inline = false) {
    const src = document.createElement('div');
    src.innerHTML = String(html ?? '');
    const out = document.createElement('div');
    cleanNode(src, inline ? INLINE_TAGS : BLOCK_TAGS, out);
    return out.innerHTML
      .replace(/<p>(\s|<br>|&nbsp;)*<\/p>/g, '')     // empty paragraphs from stray Enters
      .trim();
  }

  /* ── rich text box ───────────────────────────────────────────── */

  /**
   * @param {object} o
   * @param {string} o.value        current HTML
   * @param {boolean} o.multiline   full editor (blog posts) vs one line of copy
   * @param {function} o.onInput    called with cleaned HTML on every change
   * @param {function} [o.onImage]  async () => path, wired to the photo button
   */
  function richText(o) {
    const wrap = document.createElement('div');
    const box = document.createElement('div');
    box.className = 'rt';
    box.contentEditable = 'true';
    box.spellcheck = true;
    box.innerHTML = clean(o.value, !o.multiline);
    if (o.placeholder) box.dataset.placeholder = o.placeholder;
    if (o.multiline) box.dataset.multiline = '1';

    const cmd = (name, arg) => { document.execCommand(name, false, arg); box.focus(); sync(); };
    const sync = () => o.onInput(clean(box.innerHTML, !o.multiline));

    const bar = document.createElement('div');
    bar.className = 'rt-bar';
    const tool = (ico, title, run, state) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-label', title);
      b.innerHTML = icon(ico);
      b.onmousedown = (e) => e.preventDefault();   // keep the caret where it is
      b.onclick = run;
      if (state) b.dataset.state = state;
      return b;
    };
    const sep = () => { const s = document.createElement('span'); s.className = 'sep'; return s; };

    bar.append(
      tool('bold', 'Bold', () => cmd('bold'), 'bold'),
      tool('italic', 'Italic', () => cmd('italic'), 'italic'),
    );

    if (o.multiline) {
      bar.append(
        sep(),
        tool('h2', 'Big heading', () => cmd('formatBlock', block() === 'h2' ? 'p' : 'h2')),
        tool('h3', 'Small heading', () => cmd('formatBlock', block() === 'h3' ? 'p' : 'h3')),
        sep(),
        tool('ul', 'Bullet points', () => cmd('insertUnorderedList'), 'insertUnorderedList'),
        tool('ol', 'Numbered list', () => cmd('insertOrderedList'), 'insertOrderedList'),
        tool('quote', 'Quote', () => cmd('formatBlock', block() === 'blockquote' ? 'p' : 'blockquote')),
        sep(),
        tool('link', 'Add a link', addLink),
        tool('image', 'Add a photo', addImage),
        tool('rule', 'Divider line', () => cmd('insertHorizontalRule')),
      );
    } else {
      bar.append(tool('link', 'Add a link', addLink));
    }
    bar.append(sep(), tool('clear', 'Remove formatting', () => cmd('removeFormat')));

    function block() {
      let n = document.getSelection()?.anchorNode;
      while (n && n !== box) {
        if (n.nodeType === 1 && /^(H2|H3|BLOCKQUOTE)$/.test(n.tagName)) return n.tagName.toLowerCase();
        n = n.parentNode;
      }
      return 'p';
    }

    function addLink() {
      const sel = document.getSelection();
      const text = sel && String(sel);
      if (!text) { alert('Select the words you want to turn into a link first.'); return; }
      const url = prompt('Where should this link go?\n\nPaste a full web address, for example https://instagram.com/pratyushliftz', 'https://');
      if (!url) return;
      if (!SAFE_URL.test(url)) { alert("That doesn't look like a web address."); return; }
      cmd('createLink', url);
    }

    async function addImage() {
      if (!o.onImage) return;
      const path = await o.onImage();
      if (!path) return;
      box.focus();
      cmd('insertHTML', `<img src="/${String(path).replace(/^\//, '')}" alt="">`);
    }

    // Highlight whichever buttons apply where the caret is.
    const refresh = () => {
      for (const b of bar.querySelectorAll('button[data-state]')) {
        let on = false;
        try { on = document.queryCommandState(b.dataset.state); } catch { /* older engines */ }
        b.classList.toggle('on', on);
      }
    };

    box.addEventListener('input', sync);
    box.addEventListener('keyup', refresh);
    box.addEventListener('mouseup', refresh);
    box.addEventListener('focus', () => {
      // Bold must produce <b>, not a styled <span> the cleaner would drop.
      try { document.execCommand('styleWithCSS', false, false); } catch { /* not supported */ }
      try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* not supported */ }
    });
    box.addEventListener('blur', () => { box.innerHTML = clean(box.innerHTML, !o.multiline); });

    // Paste arrives as plain text; formatting is applied here, deliberately.
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    // One line of copy stays one line: Enter makes a line break, not a paragraph.
    if (!o.multiline) {
      box.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br>');
        sync();
      });
    }

    wrap.append(bar, box);
    return wrap;
  }

  return { icon, clean, richText };
})();
