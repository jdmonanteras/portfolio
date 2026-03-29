// ===== Clients Strips =====
const CLIENTS = {
  producer: { label: 'Producer', names: PRODUCER_CLIENTS },
  developer: { label: 'Developer', names: [...DEVELOPER_CLIENTS, ...PRODUCER_CLIENTS], reverse: true },
};

(function buildClientsStrips() {
  const COPIES = 8;
  Object.entries(CLIENTS).forEach(([key, { label, names, reverse = false }]) => {
    const el = document.getElementById(`clients${label}`);
    if (!el) return;
    const items = names.map(n => `<span>${n}</span><span class="cdot">·</span>`).join('');
    const track = Array.from({ length: COPIES }, () => items).join('');
    el.innerHTML = `<div class="clients-row">
      <span class="clients-label">${label}</span>
      <div class="clients-track-wrap">
        <div class="clients-track${reverse ? ' clients-track-reverse' : ''}">${track}</div>
      </div>
    </div>`;
  });
})();

// ===== Cursor Glow =====
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateGlow() {
  glowX += (mouseX - glowX) * 0.08;
  glowY += (mouseY - glowY) * 0.08;
  cursorGlow.style.left = glowX + 'px';
  cursorGlow.style.top = glowY + 'px';
  requestAnimationFrame(animateGlow);
}
animateGlow();

// ===== Navigation =====
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  mobileMenu.classList.toggle('active');
  document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ===== Smooth scroll for nav links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== Scroll Reveal =====
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// Trigger hero reveals on load
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .reveal').forEach(el => {
    el.classList.add('visible');
  });
});

// ===== Animated Counters =====
const statNumbers = document.querySelectorAll('.stat-number[data-count]');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      let current = 0;
      const duration = 1500;
      const step = target / (duration / 16);

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.round(current);
      }, 16);

      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => counterObserver.observe(el));

// ===== Carousel =====
(function() {
  const outer    = document.getElementById('carouselOuter');
  const viewport = document.getElementById('carouselViewport');
  const track    = document.getElementById('carouselTrack');
  const prevBtn  = document.getElementById('carouselPrev');
  const nextBtn  = document.getElementById('carouselNext');
  const dotsWrap = document.getElementById('carouselDots');

  const slides = [...track.querySelectorAll('.project-card')];
  const total  = slides.length;
  if (total === 0) return;

  let current    = 0;
  let isAnimating = false;
  const DUR = 550;

  // Build dots
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot';
    d.addEventListener('click', () => navigate(i));
    dotsWrap.appendChild(d);
  });

  function isMobile() { return window.innerWidth <= 768; }
  function sw()  { return isMobile() ? outer.offsetWidth : outer.offsetWidth * 0.76; }
  function gap() { return isMobile() ? 0 : 24; }

  function setWidths() {
    slides.forEach(s => { s.style.width = sw() + 'px'; });
  }

  function offsetFor(i) {
    const center = (outer.offsetWidth - sw()) / 2;
    return center - i * (sw() + gap());
  }

  function translate(i, animate) {
    track.style.transition = animate ? `transform ${DUR}ms cubic-bezier(0.25,1,0.5,1)` : 'none';
    track.style.transform  = `translateX(${offsetFor(i)}px)`;
  }

  function updateUI() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === current));
    prevBtn.style.visibility = current === 0         ? 'hidden' : '';
    nextBtn.style.visibility = current === total - 1 ? 'hidden' : '';
  }

  function navigate(target) {
    if (isAnimating || target < 0 || target > total - 1) return;
    isAnimating = true;
    current = target;
    translate(current, true);
    updateUI();
    setTimeout(() => { isAnimating = false; }, DUR + 50);
  }

  prevBtn.addEventListener('click', () => navigate(current - 1));
  nextBtn.addEventListener('click', () => navigate(current + 1));

  document.addEventListener('keydown', e => {
    if (document.getElementById('lightbox').classList.contains('active')) return;
    if (e.key === 'ArrowLeft')  navigate(current - 1);
    if (e.key === 'ArrowRight') navigate(current + 1);
  });

  let dragStart = null;
  viewport.addEventListener('pointerdown', e => { dragStart = e.clientX; });
  viewport.addEventListener('pointerup',   e => {
    if (dragStart === null) return;
    const delta = dragStart - e.clientX;
    if (Math.abs(delta) > 50) navigate(delta > 0 ? current + 1 : current - 1);
    dragStart = null;
  });

  // Init
  setWidths();
  translate(current, false);
  updateUI();

  window.addEventListener('resize', () => { setWidths(); translate(current, false); });
})();

// ===== Lightbox =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxVideo = document.getElementById('lightboxVideo');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

let lbItems = []; // [{src, type: 'image'|'video'}]
let lbIndex = 0;

function openLightbox(items, index) {
  lbItems = items;
  lbIndex = index;
  showLightboxItem();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightboxVideo.pause();
  lightboxVideo.src = '';
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function showLightboxItem() {
  const item = lbItems[lbIndex];
  lightboxCounter.textContent = `${lbIndex + 1} / ${lbItems.length}`;
  lightboxPrev.disabled = lbIndex === 0;
  lightboxNext.disabled = lbIndex === lbItems.length - 1;

  if (item.type === 'video') {
    lightboxImg.style.display = 'none';
    lightboxVideo.style.display = '';
    lightboxVideo.src = item.src;
    lightboxVideo.play();
  } else {
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxVideo.style.display = 'none';
    lightboxImg.style.display = '';
    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = 'scale(0.92)';
    setTimeout(() => {
      lightboxImg.src = item.src;
      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';
    }, 80);
  }
}

lightboxImg.style.transition = 'opacity 0.2s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const project = trigger.dataset.project;
    const allTriggers = [...document.querySelectorAll(`.lightbox-trigger[data-project="${project}"]`)];
    const items = allTriggers.map(t => {
      const vid = t.querySelector('video');
      if (vid) return { src: vid.src, type: 'video' };
      return { src: t.querySelector('img').src, type: 'image' };
    });
    const index = allTriggers.indexOf(trigger);
    openLightbox(items, index);
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; showLightboxItem(); } });
lightboxNext.addEventListener('click', () => { if (lbIndex < lbItems.length - 1) { lbIndex++; showLightboxItem(); } });

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target === lightboxImg.parentElement) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft' && lbIndex > 0) { lbIndex--; showLightboxItem(); }
  if (e.key === 'ArrowRight' && lbIndex < lbItems.length - 1) { lbIndex++; showLightboxItem(); }
});

// Swipe support
let lbTouchX = null;
lightbox.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (lbTouchX === null) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  lbTouchX = null;
  if (Math.abs(dx) < 40) return;
  if (dx < 0 && lbIndex < lbItems.length - 1) { lbIndex++; showLightboxItem(); }
  if (dx > 0 && lbIndex > 0) { lbIndex--; showLightboxItem(); }
}, { passive: true });

// ===== Tilt effect on project cards =====
document.querySelectorAll('.project-card-inner').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ===== Nav active state =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--text)' : '';
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(section => sectionObserver.observe(section));
