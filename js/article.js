/* =====================================================
   TESSERACT LAW: article page script
   1. Lunar south pole landing animation (hero)
   2. Nav, reading progress bar, share buttons
   ===================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. LANDING SCENE ----------
   Loop: lander descends with thrusters firing, kicks up dust on
   touchdown, lowers a ramp, and a small rover drives out. */
(function landingScene() {
  const canvas = document.getElementById('landing-scene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, S, stars = [], craters = [], ridges = [], dust = [], tracks = [];
  let running = true, last = 0, t0 = null;
  const LOOP = 17;   // seconds per cycle

  const ground = x => H * (W > 760 ? 0.8 : 0.5) + Math.pow((x - W * 0.5) / W, 2) * H * 0.35;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.max(0.75, Math.min(W / 1200, 1.3)) * (W > 760 ? 1.5 : 1.15);
    stars = Array.from({ length: Math.round(W * H / 3500) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.75, r: Math.random() * 1.2 + .2, p: Math.random() * 6 }));
    craters = Array.from({ length: 14 }, (_, i) => {
      const x = (i / 14) * W + Math.random() * 60;
      const depth = Math.random();
      return { x, dy: 14 + depth * (H * 0.2), rx: (18 + Math.random() * 50) * (0.5 + depth), ry: 0 };
    }).map(c => ({ ...c, ry: c.rx * 0.18 }));
    ridges = Array.from({ length: 9 }, (_, i) => ({ x: (i / 8) * W, h: 10 + Math.random() * 26, w: 120 + Math.random() * 180 }));
  }

  function landerX() { return W > 760 ? W * 0.8 : W * 0.68; }

  /* --- background --- */
  function drawSky(t) {
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${.3 + .6 * Math.abs(Math.sin(t * .7 + s.p))})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    // Earth, low on the horizon as seen from the south pole
    const ex = W * 0.2, ey = H * 0.24, er = Math.max(26, Math.min(W, H) * 0.055);
    const glow = ctx.createRadialGradient(ex, ey, er, ex, ey, er * 2.6);
    glow.addColorStop(0, 'rgba(110,170,255,.28)'); glow.addColorStop(1, 'rgba(110,170,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ex, ey, er * 2.6, 0, 6.283); ctx.fill();
    const eg = ctx.createRadialGradient(ex - er * .4, ey - er * .4, er * .1, ex, ey, er);
    eg.addColorStop(0, '#8ec2ff'); eg.addColorStop(.6, '#2f6fe0'); eg.addColorStop(1, '#123a86');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(80,175,120,.75)';
    ctx.beginPath(); ctx.ellipse(ex - er * .2, ey - er * .1, er * .35, er * .22, .6, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(ex + er * .25, ey + er * .3, er * .4, er * .1, -.3, 0, 6.283); ctx.fill();
    // night side
    const sh = ctx.createLinearGradient(ex - er, ey, ex + er, ey);
    sh.addColorStop(0, 'rgba(5,10,24,0)'); sh.addColorStop(.55, 'rgba(5,10,24,0)'); sh.addColorStop(1, 'rgba(5,10,24,.8)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.283); ctx.fill();
  }

  function drawSurface() {
    // distant ridges
    ctx.fillStyle = '#3a3f4f';
    for (const r of ridges) {
      const gy = ground(r.x);
      ctx.beginPath(); ctx.moveTo(r.x - r.w / 2, gy + 2);
      ctx.quadraticCurveTo(r.x, gy - r.h * S * 2, r.x + r.w / 2, gy + 2); ctx.fill();
    }
    // ground
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ground(x));
    ctx.lineTo(W, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g.addColorStop(0, '#b9b2a2'); g.addColorStop(.35, '#8f897b'); g.addColorStop(1, '#4b4840');
    ctx.fillStyle = g; ctx.fill();
    // sunlit rim
    ctx.strokeStyle = 'rgba(255,240,210,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let x = 0; x <= W; x += 8) { x ? ctx.lineTo(x, ground(x)) : ctx.moveTo(x, ground(x)); } ctx.stroke();
    // craters, with a permanently shadowed one near the landing site
    for (const c of craters) {
      const y = ground(c.x) + c.dy;
      ctx.fillStyle = 'rgba(60,56,48,.45)';
      ctx.beginPath(); ctx.ellipse(c.x, y, c.rx, c.ry, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(230,222,200,.25)';
      ctx.beginPath(); ctx.ellipse(c.x, y + c.ry * .35, c.rx * .9, c.ry * .6, 0, 0, Math.PI); ctx.fill();
    }
    const px = landerX() - 260 * S, py = ground(px) + 40 * S;
    ctx.fillStyle = 'rgba(12,14,22,.75)';
    ctx.beginPath(); ctx.ellipse(px, py, 120 * S, 20 * S, 0, 0, 6.283); ctx.fill();
  }

  /* --- lander --- */
  function drawLander(x, y, thrust, legs, ramp) {
    ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
    // plume
    if (thrust > 0) {
      const len = 30 + thrust * 70 + Math.random() * 14;
      const pg = ctx.createLinearGradient(0, 22, 0, 22 + len);
      pg.addColorStop(0, 'rgba(255,250,230,.95)'); pg.addColorStop(.35, 'rgba(255,190,110,.75)'); pg.addColorStop(1, 'rgba(255,140,80,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.moveTo(-9, 22); ctx.quadraticCurveTo(0, 22 + len * 1.25, 9, 22); ctx.closePath(); ctx.fill();
      const gl = ctx.createRadialGradient(0, 30, 0, 0, 30, 60);
      gl.addColorStop(0, `rgba(255,200,120,${.4 * thrust})`); gl.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 30, 60, 0, 6.283); ctx.fill();
    }
    // legs (spread = legs 0..1)
    const sp = 30 + legs * 12;
    ctx.strokeStyle = '#c9cdd8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, 8); ctx.lineTo(-sp, 34); ctx.moveTo(18, 8); ctx.lineTo(sp, 34);
    ctx.moveTo(-10, 14); ctx.lineTo(-sp * .55, 34); ctx.moveTo(10, 14); ctx.lineTo(sp * .55, 34);
    ctx.stroke();
    ctx.fillStyle = '#9aa0b2';
    [-sp, -sp * .55, sp * .55, sp].forEach(fx => { ctx.beginPath(); ctx.ellipse(fx, 35, 6, 2.2, 0, 0, 6.283); ctx.fill(); });
    // body: gold foil
    const bg = ctx.createLinearGradient(-26, 0, 26, 0);
    bg.addColorStop(0, '#9c6f1f'); bg.addColorStop(.45, '#f0c35e'); bg.addColorStop(1, '#a87a26');
    ctx.fillStyle = bg; ctx.fillRect(-26, -16, 52, 30);
    ctx.strokeStyle = 'rgba(80,55,15,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-26, -1); ctx.lineTo(26, -1); ctx.moveTo(-8, -16); ctx.lineTo(-8, 14); ctx.moveTo(10, -16); ctx.lineTo(10, 14); ctx.stroke();
    // engine bell
    ctx.fillStyle = '#5b6070'; ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(6, 14); ctx.lineTo(9, 22); ctx.lineTo(-9, 22); ctx.closePath(); ctx.fill();
    // solar panel on top
    ctx.fillStyle = '#2457d6'; ctx.fillRect(-22, -24, 30, 8);
    ctx.strokeStyle = 'rgba(190,210,255,.6)'; ctx.beginPath();
    for (let k = 1; k < 5; k++) { ctx.moveTo(-22 + k * 6, -24); ctx.lineTo(-22 + k * 6, -16); } ctx.stroke();
    // antenna
    ctx.strokeStyle = '#c9cdd8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(16, -16); ctx.lineTo(18, -32); ctx.stroke();
    ctx.fillStyle = '#e7e2d4'; ctx.beginPath(); ctx.ellipse(18, -34, 7, 3, -.3, 0, 6.283); ctx.fill();
    // ramp (0..1 lowers it)
    if (ramp > 0) {
      ctx.save(); ctx.translate(-26, 10); ctx.rotate(-Math.PI / 2 + ramp * (Math.PI / 2 - 0.42));
      ctx.fillStyle = '#c9cdd8'; ctx.fillRect(-2, -2, 4, 30 * ramp + 4);
      ctx.fillRect(-10, -2, 4, 30 * ramp + 4);
      ctx.restore();
    }
    ctx.restore();
  }

  /* --- rover --- */
  function drawRover(x, y, wheelAngle) {
    ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
    ctx.fillStyle = '#d6d9e2'; ctx.fillRect(-13, -14, 26, 9);
    ctx.fillStyle = '#2457d6'; ctx.fillRect(-15, -19, 22, 5);
    ctx.strokeStyle = '#c9cdd8'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(9, -14); ctx.lineTo(10, -24); ctx.stroke();
    ctx.fillStyle = '#0b1630'; ctx.beginPath(); ctx.arc(10, -25, 2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#d9a441'; ctx.fillRect(-6, -12, 6, 4);
    for (const wx of [-10, 0, 10]) {
      ctx.save(); ctx.translate(wx, -2); ctx.rotate(wheelAngle);
      ctx.fillStyle = '#3b3f4f'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#9aa0b2'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* --- dust --- */
  function kickDust(x, y, power) {
    for (let i = 0; i < power; i++) {
      const dir = Math.random() < .5 ? -1 : 1;
      dust.push({ x: x + dir * Math.random() * 10, y, vx: dir * (60 + Math.random() * 180) * S, vy: -(Math.random() * 40), r: 2 + Math.random() * 4, life: 1 });
    }
  }
  function drawDust(dt) {
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i];
      d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= .96; d.vy += 20 * dt; d.r += dt * 10; d.life -= dt * .55;
      if (d.life <= 0) { dust.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(200,192,175,${d.life * .35})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    }
  }

  const ease = u => 1 - Math.pow(1 - u, 3);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function scene(t, dt) {
    const c = t % LOOP;
    const lx = landerX(), gy = ground(lx);
    const restY = gy - 35 * S;               // lander body centre when landed
    ctx.clearRect(0, 0, W, H);
    drawSky(t);
    drawSurface();

    // 0-6.5s descent
    let ly, thrust = 0, legs = 0, ramp = 0;
    if (c < 6.5) {
      const u = c / 6.5;
      ly = -60 + (restY + 60) * ease(u);
      thrust = 0.35 + (1 - u) * 0.15 + (u > .7 ? (u - .7) * 2 : 0);
      legs = clamp((u - .45) / .3, 0, 1);
      const alt = restY - ly;
      if (alt < 120 * S) kickDust(lx, gy, Math.round(6 * (1 - alt / (120 * S))) + 1);
      if (c < dt + 0.001) { tracks = []; dust = []; }
    } else {
      ly = restY; legs = 1;
      if (c < 6.6) kickDust(lx, gy, 25);
    }
    // 8-9.5s ramp, 9.5-14s rover drives out
    if (c >= 8) ramp = clamp((c - 8) / 1.5, 0, 1);

    drawDust(dt);

    // tracks behind rover
    ctx.fillStyle = 'rgba(70,66,58,.5)';
    for (const p of tracks) ctx.fillRect(p.x, p.y, 2 * S, 1.5 * S);

    drawLander(lx, ly, c < 6.5 ? thrust : 0, legs, ramp);

    if (c >= 9.5) {
      const u = clamp((c - 9.5) / 4.5, 0, 1);
      const startX = lx - 52 * S, endX = lx - 150 * S;
      const rx = startX + (endX - startX) * ease(u);
      const ry = ground(rx) - 1;
      const rampLift = u < .08 ? (1 - u / .08) * 18 * S : 0;
      if (u > .08 && u < 1 && Math.random() < .6) tracks.push({ x: rx + 8 * S, y: ry - 1 });
      drawRover(rx, ry - rampLift, -c * 6);
    }

    // fade to restart
    if (c > LOOP - 1.2) {
      ctx.fillStyle = `rgba(5,10,24,${(c - (LOOP - 1.2)) / 1.2})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function frame(now) {
    if (!running) return;
    const t = now / 1000;
    if (t0 === null) t0 = t;
    const dt = Math.min(t - (last || t), .05); last = t;
    scene(t - t0, dt);
    requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize);
  if (reduceMotion) { scene(15, 0); return; }   // still frame: landed, rover out

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

/* ---------- 2. PAGE BEHAVIOUR ---------- */
(function nav() {
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.a-hero');
  const toggle = document.querySelector('.nav-toggle');
  const bar = document.getElementById('progress-bar');
  const body = document.querySelector('.a-body');
  function onScroll() {
    nav.classList.toggle('scrolled', scrollY > hero.offsetHeight - 90);
    if (bar && body) {
      const start = body.offsetTop, end = start + body.offsetHeight - innerHeight;
      bar.style.width = Math.max(0, Math.min(1, (scrollY - start) / (end - start))) * 100 + '%';
    }
  }
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', nav.classList.toggle('open')));
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
})();

(function share() {
  const url = encodeURIComponent(location.href.split('#')[0]);
  const title = encodeURIComponent(document.title.split(' | ')[0]);
  const li = document.getElementById('share-linkedin');
  const x = document.getElementById('share-x');
  const copy = document.getElementById('share-copy');
  if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
  if (x) x.href = 'https://x.com/intent/post?url=' + url + '&text=' + title;
  if (copy) copy.addEventListener('click', () => {
    const done = () => { copy.textContent = 'Link copied'; setTimeout(() => copy.textContent = 'Copy link', 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(decodeURIComponent(url)).then(done, done); else done();
  });
})();
