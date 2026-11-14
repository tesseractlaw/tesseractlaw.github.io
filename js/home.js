/* =====================================================
   TESSERACT LAW — Homepage script
   1. Settings (edit these)
   2. Hero space scene: stars, Earth, Moon, satellite, rocket launches
   3. Mission Log, nav, reveal-on-scroll, subscribe form
   ===================================================== */

/* ---------- 1. SETTINGS — fill these in when ready ---------- */
const SITE = {
  // Newsletter form endpoint. Example for Buttondown:
  //   "https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
  newsletterAction: "",
  linkedin: "",   // e.g. "https://www.linkedin.com/in/your-profile"
  twitter:  ""    // e.g. "https://x.com/yourhandle"
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 2. HERO SPACE SCENE ---------- */
(function heroScene() {
  const canvas = document.getElementById('space-scene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, DPR, stars = [], smoke = [], earth, moon, orbit;
  let mouseX = 0, mouseY = 0, running = true, last = 0;
  let rocket = null, nextLaunch = 1.2, shooting = null;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const R = Math.max(W * 1.15, 900);
    earth = { x: W * 0.5, y: H + R - Math.min(H * 0.2, 170), r: R };
    const mr = Math.max(28, Math.min(W, H) * 0.065);
    moon = { x: W * 0.83, y: H * 0.2, r: mr };
    orbit = { cx: W * 0.5, cy: earth.y - earth.r + 40, rx: W * 0.62, ry: H * 0.42, tilt: -0.12 };

    const count = Math.round((W * H) / 4200);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.3 + 0.2,
      d: Math.random() * 3 + 1,           // depth for parallax
      p: Math.random() * Math.PI * 2,     // twinkle phase
      c: Math.random() < 0.12 ? '255,214,140' : (Math.random() < 0.15 ? '170,200,255' : '255,255,255')
    }));
  }

  /* --- drawing helpers --- */
  function drawStars(t) {
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 / s.d + s.p));
      const x = s.x + mouseX * s.d * 4, y = s.y + mouseY * s.d * 3;
      ctx.fillStyle = `rgba(${s.c},${a})`;
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
    }
  }

  function drawShootingStar(dt) {
    if (!shooting && Math.random() < dt * 0.12) {
      shooting = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.35, vx: 520, vy: 190, life: 1 };
    }
    if (!shooting) return;
    shooting.x += shooting.vx * dt; shooting.y += shooting.vy * dt; shooting.life -= dt * 1.4;
    const g = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - 90, shooting.y - 33);
    g.addColorStop(0, `rgba(255,255,255,${Math.max(shooting.life, 0)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(shooting.x, shooting.y); ctx.lineTo(shooting.x - 90, shooting.y - 33); ctx.stroke();
    if (shooting.life <= 0) shooting = null;
  }

  function drawMoon() {
    const x = moon.x + mouseX * 10, y = moon.y + mouseY * 8, r = moon.r;
    const glow = ctx.createRadialGradient(x, y, r, x, y, r * 3.2);
    glow.addColorStop(0, 'rgba(255,236,200,0.18)'); glow.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.283); ctx.fill();

    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#fbf6e9'); g.addColorStop(0.7, '#d8d0bd'); g.addColorStop(1, '#a59d8a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();

    ctx.fillStyle = 'rgba(120,112,95,0.35)';
    [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.4, 0.12], [0.35, -0.35, 0.09], [-0.45, 0.2, 0.08]]
      .forEach(([cx, cy, cr]) => { ctx.beginPath(); ctx.arc(x + cx * r, y + cy * r, cr * r, 0, 6.283); ctx.fill(); });

    // terminator shadow
    const sh = ctx.createLinearGradient(x - r, y, x + r, y);
    sh.addColorStop(0, 'rgba(6,13,31,0)'); sh.addColorStop(0.65, 'rgba(6,13,31,0)'); sh.addColorStop(1, 'rgba(6,13,31,0.55)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }

  function drawEarth(t) {
    const { x, y, r } = earth;
    // atmosphere glow
    const atm = ctx.createRadialGradient(x, y, r * 0.985, x, y, r * 1.06);
    atm.addColorStop(0, 'rgba(120,190,255,0.75)');
    atm.addColorStop(0.25, 'rgba(90,150,255,0.35)');
    atm.addColorStop(1, 'rgba(90,150,255,0)');
    ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(x, y, r * 1.06, 0, 6.283); ctx.fill();

    // planet body
    const body = ctx.createRadialGradient(x - r * 0.25, y - r * 0.95, r * 0.05, x, y, r);
    body.addColorStop(0, '#5fa0ff'); body.addColorStop(0.08, '#2a62c9');
    body.addColorStop(0.2, '#123a86'); body.addColorStop(0.5, '#071a44'); body.addColorStop(1, '#030a1c');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();

    // drifting clouds / land hints along the limb
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.clip();
    const top = y - r;
    for (let i = 0; i < 9; i++) {
      const cx = ((i * 260 + t * 9) % (W + 400)) - 200;
      const dy = r - Math.sqrt(Math.max(r * r - (cx - x) ** 2, 0));
      const cy = top + dy + 18 + (i % 3) * 14;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(84,170,120,0.22)' : 'rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 90 + (i % 4) * 30, 10 + (i % 2) * 6, 0, 0, 6.283); ctx.fill();
    }
    // city lights on the night side
    for (let i = 0; i < 40; i++) {
      const cx = (i * 97.3) % W;
      const dy = r - Math.sqrt(Math.max(r * r - (cx - x) ** 2, 0));
      const cy = top + dy + 30 + ((i * 37) % 70);
      ctx.fillStyle = `rgba(255,200,120,${0.25 + 0.25 * Math.sin(t * 2 + i)})`;
      ctx.fillRect(cx, cy, 1.5, 1.5);
    }
    ctx.restore();

    // bright limb line
    ctx.strokeStyle = 'rgba(170,215,255,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  }

  function orbitPoint(a) {
    const { cx, cy, rx, ry, tilt } = orbit;
    const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
    return { x: cx + px * Math.cos(tilt) - py * Math.sin(tilt), y: cy + px * Math.sin(tilt) + py * Math.cos(tilt) };
  }

  function drawOrbitPath() {
    ctx.save();
    ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(217,164,65,0.28)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let a = Math.PI; a <= Math.PI * 2 + 0.01; a += 0.02) {
      const p = orbitPoint(a); a === Math.PI ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.stroke(); ctx.restore();
  }

  function drawSatellite(t) {
    const a = (t * 0.12) % (Math.PI * 2);
    const p = orbitPoint(a), p2 = orbitPoint(a + 0.01);
    const behind = Math.sin(a) > 0;               // lower half = behind Earth
    if (behind) return;
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
    const s = Math.max(0.8, Math.min(W / 1100, 1.3));
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.scale(s, s);
    // panels
    ctx.fillStyle = '#2f62d6'; ctx.strokeStyle = 'rgba(200,220,255,0.7)'; ctx.lineWidth = 0.6;
    for (const side of [-1, 1]) {
      ctx.fillRect(side > 0 ? 9 : -33, -6, 24, 12); ctx.strokeRect(side > 0 ? 9 : -33, -6, 24, 12);
      ctx.beginPath(); for (let k = 1; k < 4; k++) { const xx = (side > 0 ? 9 : -33) + k * 6; ctx.moveTo(xx, -6); ctx.lineTo(xx, 6); } ctx.stroke();
    }
    ctx.strokeStyle = '#c9d4ea'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    // body
    ctx.fillStyle = '#d9a441'; ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#f5f2ea'; ctx.beginPath(); ctx.arc(0, -10, 4, Math.PI, 0); ctx.fill();
    // blinking light
    if (Math.sin(t * 6) > 0.6) { ctx.fillStyle = '#ff6b5a'; ctx.beginPath(); ctx.arc(0, 8, 1.8, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }

  /* --- rocket --- */
  function launch() {
    const fromLeft = Math.random() < 0.5;
    // launch from the outer thirds and arc outward so the trail never crosses the headline
    const wide = W > 820;
    const x0 = W * (fromLeft ? (wide ? 0.12 : 0.1) + Math.random() * 0.08 : (wide ? 0.8 : 0.82) + Math.random() * 0.08);
    const dy0 = earth.r - Math.sqrt(earth.r ** 2 - (x0 - earth.x) ** 2);
    rocket = {
      x0, y0: earth.y - earth.r + dy0 + 2,
      drift: (fromLeft ? -1 : 1) * W * (0.12 + Math.random() * 0.1),
      rise: H * 1.05, dur: 7 + Math.random() * 2, t: 0
    };
  }

  function rocketPos(r, u) {
    // gravity turn: climb straight first, pitch over later
    return { x: r.x0 + r.drift * u * u * u, y: r.y0 - r.rise * (u * 0.9 + u * u * 0.1) };
  }

  function updateRocket(dt) {
    if (!rocket) { nextLaunch -= dt; if (nextLaunch <= 0) launch(); return; }
    rocket.t += dt;
    const u = Math.min(rocket.t / rocket.dur, 1);
    const ease = u < 0.08 ? u * u * 12.5 * 0.08 : u;     // slow lift-off
    const p = rocketPos(rocket, ease), q = rocketPos(rocket, Math.min(ease + 0.005, 1));
    const ang = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
    const scale = (1 - u * 0.55) * Math.max(0.75, Math.min(W / 1200, 1.25));
    rocket.p = p; rocket.ang = ang; rocket.scale = scale;

    // exhaust particles from the nozzle
    const nx = p.x - Math.sin(ang) * -22 * scale, ny = p.y + Math.cos(ang) * 22 * scale;
    const n = u < 0.15 ? 6 : 3;
    for (let i = 0; i < n; i++) {
      smoke.push({
        x: nx + (Math.random() - 0.5) * 4, y: ny,
        vx: Math.sin(ang) * -40 * (Math.random() * 0.6 + 0.4) + (Math.random() - 0.5) * (u < 0.15 ? 120 : 30),
        vy: Math.cos(ang) * 40 * (Math.random() * 0.6 + 0.4) + (u < 0.15 ? Math.random() * 10 : 0),
        r: (u < 0.15 ? 6 : 3) * scale, life: 1, decay: 0.35 + Math.random() * 0.4
      });
    }
    if (u >= 1) { rocket = null; nextLaunch = 2.5 + Math.random() * 3; }
  }

  function drawSmoke(dt) {
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.98; s.vy *= 0.98;
      s.r += dt * 14; s.life -= dt * s.decay;
      if (s.life <= 0) { smoke.splice(i, 1); continue; }
      const hot = s.life > 0.85;
      ctx.fillStyle = hot ? `rgba(255,170,90,${(s.life - 0.85) * 4})` : `rgba(220,226,240,${s.life * 0.22})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if (smoke.length > 900) smoke.splice(0, smoke.length - 900);
  }

  function drawRocket(t) {
    if (!rocket || !rocket.p) return;
    const { p, ang, scale } = rocket;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.scale(scale, scale);
    // flame
    const fl = 26 + Math.sin(t * 60) * 5 + Math.random() * 6;
    const fg = ctx.createLinearGradient(0, 18, 0, 18 + fl);
    fg.addColorStop(0, '#fff6d5'); fg.addColorStop(0.3, '#ffc061'); fg.addColorStop(0.7, 'rgba(255,110,60,0.8)'); fg.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(-6, 18); ctx.quadraticCurveTo(0, 18 + fl * 1.2, 6, 18); ctx.closePath(); ctx.fill();
    const glow = ctx.createRadialGradient(0, 24, 0, 0, 24, 30);
    glow.addColorStop(0, 'rgba(255,190,100,0.55)'); glow.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 24, 30, 0, 6.283); ctx.fill();
    // fins
    ctx.fillStyle = '#c24a3a';
    ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(-15, 20); ctx.lineTo(-7, 16); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7, 6); ctx.lineTo(15, 20); ctx.lineTo(7, 16); ctx.closePath(); ctx.fill();
    // body
    const bg = ctx.createLinearGradient(-7, 0, 7, 0);
    bg.addColorStop(0, '#c9ccd6'); bg.addColorStop(0.45, '#ffffff'); bg.addColorStop(1, '#9aa0b2');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(8, -20, 7, -8, 7, 0); ctx.lineTo(7, 18); ctx.lineTo(-7, 18); ctx.lineTo(-7, 0); ctx.bezierCurveTo(-7, -8, -8, -20, 0, -30); ctx.fill();
    // gold band + window
    ctx.fillStyle = '#d9a441'; ctx.fillRect(-7, 2, 14, 4);
    ctx.fillStyle = '#0c1a3a'; ctx.beginPath(); ctx.arc(0, -10, 3, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#4f8cff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  /* --- loop --- */
  function frame(now) {
    if (!running) return;
    const t = now / 1000;
    const dt = Math.min(t - (last || t), 0.05); last = t;
    ctx.clearRect(0, 0, W, H);
    drawStars(t);
    drawShootingStar(dt);
    drawMoon();
    drawOrbitPath();
    updateRocket(dt);
    drawSmoke(dt);
    drawRocket(t);
    drawEarth(t);
    drawSatellite(t);
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  if (reduceMotion) {
    // single still frame with a rocket mid-flight
    launch(); rocket.t = rocket.dur * 0.35; updateRocket(0);
    const t = 10; drawStars(t); drawMoon(); drawOrbitPath(); drawRocket(t); drawEarth(t); drawSatellite(t);
    return;
  }

  // pause when hero is off-screen or tab hidden (saves battery)
  new IntersectionObserver(([e]) => {
    const was = running; running = e.isIntersecting && !document.hidden;
    if (running && !was) { last = 0; requestAnimationFrame(frame); }
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    const was = running; running = !document.hidden;
    if (running && !was) { last = 0; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();

/* Twinkling stars behind the Mission Log */
(function miniStars() {
  const c = document.querySelector('.mini-stars');
  if (!c) return;
  const ctx = c.getContext('2d');
  let pts = [], W, H, on = false;
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = c.clientWidth; H = c.clientHeight; c.width = W * d; c.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    pts = Array.from({ length: Math.round(W * H / 6000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + .2, p: Math.random() * 6 }));
  }
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const t = now / 1000;
    for (const s of pts) {
      ctx.fillStyle = `rgba(255,255,255,${.25 + .5 * Math.abs(Math.sin(t * .6 + s.p))})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if (on && !reduceMotion) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); draw(0);
  new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) requestAnimationFrame(draw); }).observe(c);
})();

/* ---------- 3. PAGE BEHAVIOUR ---------- */

// Mission Log
(function renderNews() {
  const list = document.getElementById('news-list');
  const items = (window.MISSION_LOG || []).slice(0, 6);
  if (!list) return;
  if (!items.length) { list.closest('section').style.display = 'none'; return; }
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  list.innerHTML = items.map(n => `
    <li class="reveal">
      <time>${esc(n.date)}</time>
      <div class="what">
        <h3>${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)} ↗</a>` : esc(n.title)}</h3>
        <span class="src">${esc(n.source)}</span>
      </div>
      <p class="angle"><b>Legal angle</b>${esc(n.angle)}</p>
    </li>`).join('');
})();

// Nav: solid background after hero, mobile menu
(function nav() {
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');
  const toggle = document.querySelector('.nav-toggle');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > hero.offsetHeight - 90);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
  }));
})();

// Reveal on scroll
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  els.forEach(e => io.observe(e));
})();

// Subscribe form + social links
(function subscribe() {
  const form = document.getElementById('subscribe-form');
  const note = document.getElementById('form-note');
  const social = document.getElementById('social-links');
  if (SITE.linkedin) social.insertAdjacentHTML('beforeend', `<a href="${SITE.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`);
  if (SITE.twitter)  social.insertAdjacentHTML('beforeend', `<a href="${SITE.twitter}" target="_blank" rel="noopener">X / Twitter</a>`);
  if (!form) return;
  if (SITE.newsletterAction) {
    form.action = SITE.newsletterAction; form.method = 'post'; form.target = '_blank';
    return; // the newsletter service handles the submission
  }
  // No newsletter service connected yet: don't collect emails we can't keep.
  form.style.display = 'none';
  note.textContent = 'Newsletter opening soon.' + (SITE.linkedin || SITE.twitter ? ' Follow along meanwhile:' : '');
})();
