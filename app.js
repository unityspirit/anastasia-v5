/**
 * АНАСТАСИЯ ЕМЕЛЬЯНОВА — ВЕРСИЯ 5 (LUXURY / ГЛЯНЕЦ + НОВЫЙ ВИДЕОФОН)
 */

const TOTAL_FRAMES = 280;
const LERP = 0.04;
const CONCURRENCY = 24;

const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;
const FRAME_DIR = isMobile ? 'frames-mobile' : 'frames-webp';
const MOBILE_TOTAL = 286;
const ACTUAL_FRAMES = isMobile ? MOBILE_TOTAL : TOTAL_FRAMES;

const canvas = document.getElementById('gl-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let canvasDpr = 1;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  canvasDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  canvas.width = window.innerWidth * canvasDpr;
  canvas.height = window.innerHeight * canvasDpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const frames = new Array(ACTUAL_FRAMES);
let loadedCount = 0;
let isReady = false;

function frameName(i) {
  return `${FRAME_DIR}/frame_${String(i + 1).padStart(6, '0')}.webp?v=1`;
}

async function loadAllFrames() {
  const queue = Array.from({ length: ACTUAL_FRAMES }, (_, i) => i);

  async function worker() {
    while (queue.length) {
      const i = queue.shift();
      await new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => {
          frames[i] = img;
          loadedCount++;

          const pct = Math.round((loadedCount / ACTUAL_FRAMES) * 100);
          const bar = document.getElementById('progress-bar');
          if (bar) bar.style.width = pct + '%';

          if (loadedCount === 1) {
            isReady = true;
            startAnimationLoop();
          }

          if (loadedCount === ACTUAL_FRAMES) {
            const loader = document.getElementById('loader');
            if (loader) {
              loader.style.opacity = '0';
              setTimeout(() => loader.style.display = 'none', 700);
            }
          }
          resolve();
        };
        img.src = frameName(i);
      });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

let currentFrame = 0;
let targetFrame = 0;

window.addEventListener('scroll', () => {
  if (!isReady) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  targetFrame = progress * (ACTUAL_FRAMES - 1);
}, { passive: true });

function drawFrame(idx) {
  if (!ctx) return;
  const img = frames[Math.max(0, Math.min(idx, ACTUAL_FRAMES - 1))];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const W = window.innerWidth;
  const H = window.innerHeight;

  const r = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const iw = img.naturalWidth * r;
  const ih = img.naturalHeight * r;
  const x = (W - iw) / 2;
  const y = (H - ih) / 2;

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, x, y, iw, ih);

  // Теплая люксовая виньетка
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
  vig.addColorStop(0, 'rgba(247, 243, 236, 0.10)');
  vig.addColorStop(1, 'rgba(239, 233, 222, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function startAnimationLoop() {
  function loop() {
    requestAnimationFrame(loop);
    currentFrame += (targetFrame - currentFrame) * LERP;
    if (isReady) {
      drawFrame(Math.round(currentFrame));
    }
  }
  loop();
}

// Intersection Observer для секций
const pages = Array.from(document.querySelectorAll('.page'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = pages.indexOf(entry.target);
      pages.forEach((p, i) => p.classList.toggle('is-active', i === idx));

      const currentId = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${currentId}`);
      });
    }
  });
}, { rootMargin: '-20% 0px -20% 0px' });

pages.forEach(p => observer.observe(p));

// Мобильное меню
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });
}

// Модальное окно записи
window.openBookingModal = function(tariffName) {
  const modal = document.getElementById('booking-modal');
  const title = document.getElementById('modal-title');
  const inputTariff = document.getElementById('form-tariff');
  if (title && tariffName) title.textContent = `Запись: ${tariffName}`;
  if (inputTariff && tariffName) inputTariff.value = tariffName;
  if (modal) modal.classList.remove('hidden');
};

window.closeBookingModal = function() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('hidden');
};

window.handleBookingSubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('client-name').value;
  const contact = document.getElementById('client-contact').value;
  const tariff = document.getElementById('form-tariff').value;
  const text = `Здравствуйте, Анастасия!%0AМеня зовут ${encodeURIComponent(name)}.%0AКонтакт: ${encodeURIComponent(contact)}%0AИнтересует: ${encodeURIComponent(tariff)}`;
  window.open(`https://t.me/AnastasiaEmelyanova?text=${text}`, '_blank');
  alert(`Спасибо, ${name}! Открываем диалог в Telegram.`);
  closeBookingModal();
  e.target.reset();
};

window.openPaymentModal = function(title, price) {
  const modal = document.getElementById('payment-modal');
  const titleEl = document.getElementById('pay-title');
  if (titleEl && title) titleEl.textContent = title;
  if (modal) modal.classList.remove('hidden');
};

window.closePaymentModal = function() {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.classList.add('hidden');
};

window.handlePaymentSubmit = function(e) {
  e.preventDefault();
  const email = document.getElementById('pay-email').value;
  const name = document.getElementById('pay-name').value;
  alert(`Спасибо, ${name}! Заказ оформлен на почту ${email}.`);
  closePaymentModal();
  e.target.reset();
};

loadAllFrames();
