/* tesseractlaw — main.js */

// Subtle nav transparency on scroll
const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(2, 4, 8, 0.97)';
    } else {
      nav.style.background = 'rgba(2, 4, 8, 0.85)';
    }
  }, { passive: true });
}

// Animate elements on scroll into view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.post-card, .about-inner, .section-label').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Live coordinate display
function updateCoords() {
  const now = new Date();
  const utc = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const el = document.getElementById('live-time');
  if (el) el.textContent = utc;
}
updateCoords();
setInterval(updateCoords, 1000);
