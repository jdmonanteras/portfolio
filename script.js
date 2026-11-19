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

// ===== Carousel =====
(function() {
  const outer    = document.getElementById('carouselOuter');
  const viewport = document.getElementById('carouselViewport');
  const track    = document.getElementById('carouselTrack');
  const prevBtn  = document.getElementById('carouselPrev');
  const nextBtn  = document.getElementById('carouselNext');
  const dotsWrap = document.getElementById('carouselDots');

  const originals = [...track.querySelectorAll('.project-card')];
  const total = originals.length;
  if (total === 0) return;

  const DUR = 550;
  // Clones on each side let the track run past either end, then snap back to the real slide unseen.
  const CLONES = total > 1 ? Math.min(2, total) : 0;

  function makeClone(slide) {
    const c = slide.cloneNode(true);
    c.classList.add('is-clone');
    c.removeAttribute('id');
    c.setAttribute('aria-hidden', 'true');
    return c;
  }
  for (let i = 0; i < CLONES; i++) {
    track.insertBefore(makeClone(originals[total - 1 - i]), track.firstChild);
    track.appendChild(makeClone(originals[i]));
  }

  const slides = [...track.querySelectorAll('.project-card')];
  const realIndex = p => (((p - CLONES) % total) + total) % total;

  let pos = CLONES;
  let isAnimating = false;

  originals.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot';
    d.setAttribute('aria-label', `Go to project ${i + 1}`);
    d.addEventListener('click', () => goToReal(i));
    dotsWrap.appendChild(d);
  });

  function isMobile() { return window.innerWidth <= 768; }
  function sw() { return isMobile() ? outer.offsetWidth : outer.offsetWidth * 0.76; }

  function setWidths() {
    slides.forEach(s => { s.style.width = sw() + 'px'; });
  }

  function setPosition(p, animate, dragOffset = 0) {
    const s = slides[p];
    const x = (viewport.offsetWidth - s.offsetWidth) / 2 - s.offsetLeft + dragOffset;
    track.style.transition = animate ? `transform ${DUR}ms cubic-bezier(0.25,1,0.5,1)` : 'none';
    track.style.transform = `translateX(${x}px)`;
  }

  function updateVideos() {
    slides.forEach((s, i) => {
      s.querySelectorAll('video').forEach(v => {
        if (i === pos) v.play().catch(() => {});
        else v.pause();
      });
    });
  }

  function updateUI() {
    const r = realIndex(pos);
    // Mark clone and original alike so the snap-back never flashes an opacity change.
    slides.forEach((s, i) => s.classList.toggle('active', realIndex(i) === r));
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === r));
  }

  function goTo(p) {
    if (isAnimating || p === pos || p < 0 || p >= slides.length) return;
    isAnimating = true;
    pos = p;
    setPosition(pos, true);
    updateUI();
    setTimeout(() => {
      if (pos < CLONES) pos += total;
      else if (pos >= CLONES + total) pos -= total;
      setPosition(pos, false);
      updateVideos();
      isAnimating = false;
    }, DUR);
  }

  function goToReal(i) {
    let delta = i - realIndex(pos);
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    goTo(Math.abs(delta) <= CLONES ? pos + delta : CLONES + i);
  }

  prevBtn.addEventListener('click', () => goTo(pos - 1));
  nextBtn.addEventListener('click', () => goTo(pos + 1));

  let inView = false;
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.25 }).observe(outer);

  document.addEventListener('keydown', e => {
    if (!inView || document.getElementById('lightbox').classList.contains('active')) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') goTo(pos - 1);
    if (e.key === 'ArrowRight') goTo(pos + 1);
  });

  // Drag / swipe: the track follows the pointer, then commits or springs back.
  let drag = null;
  let suppressClick = false;

  viewport.addEventListener('pointerdown', e => {
    suppressClick = false;
    if (isAnimating || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, active: false };
  });

  viewport.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x;
    if (!drag.active) {
      if (Math.abs(drag.dx) < 8) return;
      if (Math.abs(e.clientY - drag.y) > Math.abs(drag.dx)) { drag = null; return; }
      drag.active = true;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('dragging');
    }
    setPosition(pos, false, drag.dx);
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { active, dx } = drag;
    drag = null;
    viewport.classList.remove('dragging');
    if (!active) return;
    suppressClick = true;
    if (Math.abs(dx) > Math.min(80, sw() * 0.15)) goTo(pos + (dx < 0 ? 1 : -1));
    else setPosition(pos, true);
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('dragstart', e => e.preventDefault());

  // Capture phase: runs before the lightbox handlers on the thumbnails.
  viewport.addEventListener('click', e => {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const slide = e.target.closest('.project-card');
    if (slide && slide !== slides[pos]) {
      e.preventDefault();
      e.stopPropagation();
      goTo(slides.indexOf(slide));
    }
  }, true);

  setWidths();
  setPosition(pos, false);
  updateUI();
  updateVideos();

  window.addEventListener('resize', () => { setWidths(); setPosition(pos, false); });
})();

// ===== Lightbox =====
const lightbox = document.getElementById('lightbox');
const lbViewport = document.getElementById('lightboxViewport');
const lbTrack = document.getElementById('lightboxTrack');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

const LB_DUR = 350;
let lbItems = []; // [{src, type: 'image'|'video'}]
let lbIndex = 0;

function openLightbox(items, index) {
  lbItems = items;
  lbTrack.innerHTML = '';
  items.forEach(item => {
    const slide = document.createElement('div');
    slide.className = 'lightbox-slide';
    const media = document.createElement(item.type === 'video' ? 'video' : 'img');
    media.src = item.src;
    if (item.type === 'video') {
      media.controls = true;
      media.playsInline = true;
      media.loop = true;
    } else {
      media.alt = '';
      media.draggable = false;
    }
    slide.appendChild(media);
    lbTrack.appendChild(slide);
  });
  lbIndex = index;
  setLbPosition(false);
  updateLb();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  lbTrack.querySelectorAll('video').forEach(v => v.pause());
  setTimeout(() => {
    if (lightbox.classList.contains('active')) return;
    lbTrack.innerHTML = '';
    lightbox.style.removeProperty('background-color');
  }, 300);
}

function setLbPosition(animate, dx = 0, dy = 0) {
  lbTrack.style.transition = animate ? `transform ${LB_DUR}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none';
  lbTrack.style.transform = `translate3d(calc(${-lbIndex * 100}% + ${dx}px), ${dy}px, 0)`;
}

function updateLb() {
  lightboxCounter.textContent = `${lbIndex + 1} / ${lbItems.length}`;
  lightboxPrev.disabled = lbIndex === 0;
  lightboxNext.disabled = lbIndex === lbItems.length - 1;
  [...lbTrack.children].forEach((slide, i) => {
    const v = slide.querySelector('video');
    if (!v) return;
    if (i === lbIndex) v.play().catch(() => {});
    else v.pause();
  });
}

function lbGo(i) {
  lbIndex = Math.max(0, Math.min(lbItems.length - 1, i));
  setLbPosition(true);
  updateLb();
}

// Drag: horizontal moves between items, vertical drags the item away to close.
let lbDrag = null;
let lbSuppressClick = false;

lbViewport.addEventListener('pointerdown', e => {
  lbSuppressClick = false;
  if (e.pointerType === 'mouse' && (e.button !== 0 || e.target.closest('video'))) return;
  lbDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, axis: null, t: performance.now() };
});

lbViewport.addEventListener('pointermove', e => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  let dx = e.clientX - lbDrag.x;
  const dy = e.clientY - lbDrag.y;
  if (!lbDrag.axis) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
    lbDrag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    lbViewport.setPointerCapture(e.pointerId);
    lbViewport.classList.add('dragging');
  }
  if (lbDrag.axis === 'x') {
    const atEdge = (lbIndex === 0 && dx > 0) || (lbIndex === lbItems.length - 1 && dx < 0);
    if (atEdge) dx *= 0.35;
    lbDrag.dx = dx;
    setLbPosition(false, dx, 0);
  } else {
    lbDrag.dy = dy;
    setLbPosition(false, 0, dy);
    const fade = Math.min(Math.abs(dy) / 400, 1);
    lightbox.style.backgroundColor = `rgba(0, 0, 0, ${0.95 * (1 - fade * 0.6)})`;
  }
});

function endLbDrag(e) {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  const { axis, dx, dy, t } = lbDrag;
  lbDrag = null;
  lbViewport.classList.remove('dragging');
  if (!axis) return;
  lbSuppressClick = true;
  const elapsed = Math.max(performance.now() - t, 1);
  if (axis === 'x') {
    const flick = Math.abs(dx) / elapsed > 0.5 && Math.abs(dx) > 20;
    if (Math.abs(dx) > lbViewport.offsetWidth * 0.18 || flick) lbGo(lbIndex + (dx < 0 ? 1 : -1));
    else setLbPosition(true);
  } else {
    const flick = Math.abs(dy) / elapsed > 0.6 && Math.abs(dy) > 30;
    if (Math.abs(dy) > 120 || flick) {
      closeLightbox();
    } else {
      setLbPosition(true);
      lightbox.style.removeProperty('background-color');
    }
  }
}
lbViewport.addEventListener('pointerup', endLbDrag);
lbViewport.addEventListener('pointercancel', endLbDrag);

lbViewport.addEventListener('click', e => {
  if (lbSuppressClick) { lbSuppressClick = false; return; }
  if (!e.target.closest('img, video')) closeLightbox();
});

document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const allTriggers = [...trigger.closest('.project-card').querySelectorAll('.lightbox-trigger')];
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
lightboxPrev.addEventListener('click', () => lbGo(lbIndex - 1));
lightboxNext.addEventListener('click', () => lbGo(lbIndex + 1));

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lbGo(lbIndex - 1);
  if (e.key === 'ArrowRight') lbGo(lbIndex + 1);
});

// ===== Tilt effect on project cards =====
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const MAX_TILT = 4; // degrees at the card edge
  const EASE = 0.14;  // fraction of remaining distance covered per frame

  document.querySelectorAll('.project-card-inner').forEach(card => {
    const t = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };

    function frame() {
      t.x += (t.tx - t.x) * EASE;
      t.y += (t.ty - t.y) * EASE;
      card.style.setProperty('--ry', `${(t.x * MAX_TILT).toFixed(3)}deg`);
      card.style.setProperty('--rx', `${(-t.y * MAX_TILT).toFixed(3)}deg`);
      const settled = Math.abs(t.tx - t.x) < 0.001 && Math.abs(t.ty - t.y) < 0.001;
      t.raf = settled ? 0 : requestAnimationFrame(frame);
    }
    const run = () => { if (!t.raf) t.raf = requestAnimationFrame(frame); };

    card.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
      const idle = !card.parentElement.classList.contains('active') || card.closest('.dragging');
      t.tx = idle ? 0 : ((e.clientX - r.left) / r.width - 0.5) * 2;
      t.ty = idle ? 0 : ((e.clientY - r.top) / r.height - 0.5) * 2;
      run();
    });

    card.addEventListener('pointerleave', () => { t.tx = 0; t.ty = 0; run(); });
  });
}

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
