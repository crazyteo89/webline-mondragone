// Webline – interazioni
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  // Orari in minuti dalla mezzanotte (0 = domenica)
  const ORARI = {
    0: [],
    1: [[540, 780], [960, 1200]],
    2: [[540, 780], [960, 1200]],
    3: [[540, 780], [960, 1200]],
    4: [[540, 780], [960, 1200]],
    5: [[540, 780], [960, 1200]],
    6: [[540, 780]],
  };
  const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const hhmm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

  function oraRoma() {
    const p = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const g = Object.fromEntries(p.map(x => [x.type, x.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g.weekday);
    return { day, min: +g.hour * 60 + +g.minute };
  }

  function prossimaApertura(day, min) {
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7;
      const slot = ORARI[d].find(([a]) => i > 0 || a > min);
      if (slot) {
        const quando = i === 0 ? 'oggi' : i === 1 ? 'domani' : GIORNI[d];
        return `${quando} alle ${hhmm(slot[0])}`;
      }
    }
    return '';
  }

  function aggiornaStato() {
    const { day, min } = oraRoma();
    const aperto = ORARI[day].find(([a, b]) => min >= a && min < b);
    let testo;
    if (aperto) {
      const resta = aperto[1] - min;
      testo = resta <= 30 ? `Aperto · chiude tra ${resta} min` : `Aperto ora · chiude alle ${hhmm(aperto[1])}`;
    } else {
      testo = `Chiuso ora · riapre ${prossimaApertura(day, min)}`;
    }
    document.querySelectorAll('[data-status]').forEach(el => {
      el.classList.toggle('is-open', !!aperto);
      el.classList.toggle('is-closed', !aperto);
      el.querySelector('[data-status-text]').textContent = testo;
    });
    document.querySelectorAll('.hours__t tr').forEach(tr => {
      const oggi = +tr.dataset.day === day;
      tr.classList.toggle('is-today', oggi);
      if (oggi) tr.setAttribute('aria-current', 'date'); else tr.removeAttribute('aria-current');
    });
  }
  aggiornaStato();
  setInterval(aggiornaStato, 30000);

  // Header e menu mobile
  const top = document.querySelector('.top');
  const btn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  const label = btn.querySelector('.sr');

  function apriMenu(apri) {
    btn.setAttribute('aria-expanded', String(apri));
    label.textContent = apri ? 'Chiudi il menu' : 'Apri il menu';
    if (apri) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      menu.querySelector('a').focus();
    } else {
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, reduce ? 0 : 300);
    }
  }
  btn.addEventListener('click', () => apriMenu(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) apriMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { apriMenu(false); btn.focus(); }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) apriMenu(false); });

  // Apertura della prima schermata
  document.querySelectorAll('.hero__title .w').forEach((w, k) => w.style.setProperty('--k', k));
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector('.hero').classList.add('is-ready')));

  // Entrate delle sezioni: ognuna a modo suo, una volta sola
  const entrate = [
    ['.repair__head', 'rv'], ['.sale .h2', 'rv-clip'], ['.sale__main', ''], ['.sale__more', 'stagger'],
    ['.tel__in', 'rv'], ['.tel__list', 'stagger'], ['.more .h2', 'rv-clip'],
    ['.more__main', 'rv-scale'], ['.more__list', 'stagger'], ['.voices .h2', 'rv'],
    ['.voices__list', 'stagger'], ['.write__text', 'rv'], ['.form', 'rv-scale'],
    ['.where .h2', 'rv-clip'], ['.where__grid', 'rv'],
  ];
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;
  entrate.forEach(([sel, cls]) => document.querySelectorAll(sel).forEach(el => {
    if (cls === 'stagger') [...el.children].forEach((c, k) => c.style.setProperty('--k', k));
    if (io) { if (cls) el.classList.add(cls); io.observe(el); }
    else el.classList.add('in');
  }));

  // Assistenza: il dispositivo segue la voce più vicina al centro
  const reps = [...document.querySelectorAll('.rep')];
  const devs = { phone: '.dev--phone', laptop: '.dev--laptop', pad: '.dev--pad' };
  const cap = document.querySelector('[data-cap]');
  let attiva = null;
  function attivaVoce(li) {
    if (li === attiva) return;
    attiva = li;
    reps.forEach(r => r.classList.toggle('is-active', r === li));
    Object.entries(devs).forEach(([k, s]) => document.querySelector(s).classList.toggle('is-on', k === li.dataset.dev));
    const ph = document.querySelector('.dev--phone');
    ph.querySelectorAll('.part').forEach(p => p.classList.toggle('is-on', p.dataset.part === li.dataset.part));
    cap.textContent = li.querySelector('h3').textContent;
  }
  attivaVoce(reps[0]);

  // Barra azioni mobile, operatori che scorrono e voce attiva: un solo ciclo rAF
  const dock = document.querySelector('.dock');
  const hero = document.querySelector('.hero');
  const gruppi = [...document.querySelectorAll('.ops')].map(g => ({ box: g.closest('section'), rows: [...g.querySelectorAll('.ops__row')] }));
  const navLinks = [...document.querySelectorAll('.nav a')];
  const sezioni = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight;
    top.classList.toggle('is-scrolled', scrollY > 8);
    const dockOn = hero.getBoundingClientRect().bottom < 80;
    dock.classList.toggle('is-on', dockOn);
    document.body.classList.toggle('dock-on', dockOn);

    // sezione corrente nel menu
    let corrente = -1;
    sezioni.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) corrente = i; });
    const fine = sezioni[sezioni.length - 1];
    if (fine && fine.getBoundingClientRect().bottom < vh * 0.4) corrente = -1;
    navLinks.forEach((a, i) => { if (i === corrente) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });

    const mid = vh * 0.5;
    let best = null, dist = Infinity;
    reps.forEach(r => {
      const b = r.getBoundingClientRect();
      const d = Math.abs(b.top + b.height / 2 - mid);
      if (d < dist) { dist = d; best = r; }
    });
    if (best) attivaVoce(best);

    if (!reduce) {
      gruppi.forEach(({ box, rows }) => {
        const b = box.getBoundingClientRect();
        if (b.bottom < 0 || b.top > vh) return;
        const p = (vh - b.top) / (vh + b.height); // 0 → 1 mentre la sezione attraversa lo schermo
        rows.forEach(r => { r.style.transform = `translate3d(${-20 + (+r.dataset.drift) * (p - 0.5) * -16}%,0,0)`; });
      });
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  // Profondità al mouse nella prima schermata
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const art = document.querySelector('.hero__art');
    const layers = [...art.querySelectorAll('[data-depth]')];
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      layers.forEach(l => { const d = +l.dataset.depth; l.style.translate = `${x * d * 10}px ${y * d * 10}px`; });
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    art.addEventListener('pointermove', e => {
      const b = art.getBoundingClientRect();
      tx = (e.clientX - b.left) / b.width - 0.5; ty = (e.clientY - b.top) / b.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    art.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  // Modulo WhatsApp
  const form = document.getElementById('wa-form');
  const msg = form.querySelector('#f-msg');
  const err = form.querySelector('#f-msg-err');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const testo = msg.value.trim();
    if (!testo) {
      err.hidden = false; msg.setAttribute('aria-invalid', 'true'); msg.focus(); return;
    }
    const nome = form.nome.value.trim();
    const tema = form.tema.value;
    const righe = [`Ciao Webline${nome ? `, sono ${nome}` : ''}. Vi scrivo per ${tema}.`, '', testo];
    window.open(`https://wa.me/393533468897?text=${encodeURIComponent(righe.join('\n'))}`, '_blank', 'noopener');
  });
  msg.addEventListener('input', () => { if (msg.value.trim()) { err.hidden = true; msg.removeAttribute('aria-invalid'); } });

  // Mappa caricata solo al clic
  const mapBtn = document.querySelector('.map__load');
  mapBtn.addEventListener('click', () => {
    const box = document.querySelector('[data-map]');
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=WebLine,+Via+Castelvolturno+18,+81034+Mondragone+CE&z=17&output=embed';
    f.title = 'Mappa: Webline, Via Castelvolturno 18, Mondragone';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    box.querySelector('.map__facade').remove();
    box.appendChild(f);
    f.focus();
  });
})();
