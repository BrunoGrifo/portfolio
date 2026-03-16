// ── Snap scroll ──────────────────────────────────────────────────────────────

const snapSections = [...document.querySelectorAll('section, footer#contact')];
let currentIndex = 0;
let isAnimating = false;
const SCROLL_DURATION = 700; // ms — increase for slower snap

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function scrollToIndex(index) {
  if (index < 0 || index >= snapSections.length || isAnimating) return;
  currentIndex = index;
  isAnimating = true;

  const startY = window.scrollY;
  const targetY = snapSections[index].getBoundingClientRect().top + startY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / SCROLL_DURATION, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      isAnimating = false;
    }
  }

  requestAnimationFrame(step);
}

// Init current index to the section closest to viewport
function initIndex() {
  currentIndex = snapSections.reduce((best, section, i) => {
    const distBest = Math.abs(snapSections[best].getBoundingClientRect().top);
    const distCur  = Math.abs(section.getBoundingClientRect().top);
    return distCur < distBest ? i : best;
  }, 0);
}

window.addEventListener('load', initIndex);

// Wheel — intercept and snap one section at a time
window.addEventListener('wheel', (e) => {
  // Let the timeline's inner scroll handle its own wheel events
  if (timelineContent && timelineContent.contains(e.target)) {
    const { scrollTop, scrollHeight, clientHeight } = timelineContent;
    const atTop    = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
  }

  e.preventDefault();
  if (isAnimating) return;
  scrollToIndex(currentIndex + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

// Touch — swipe up/down
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (timelineContent && timelineContent.contains(e.target)) return;
  if (isAnimating) { e.preventDefault(); return; }

  const delta = touchStartY - e.touches[0].clientY;
  if (Math.abs(delta) > 40) {
    e.preventDefault();
    scrollToIndex(currentIndex + (delta > 0 ? 1 : -1));
  }
}, { passive: false });

// Keyboard arrow / page keys
window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown'].includes(e.key)) {
    e.preventDefault();
    scrollToIndex(currentIndex + 1);
  } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
    e.preventDefault();
    scrollToIndex(currentIndex - 1);
  }
});


// ── Skill bar animations ──────────────────────────────────────────────────────

const skillBars = document.querySelectorAll('.skill-rate');

function resetSkillBars() {
  skillBars.forEach(bar => {
    bar.style.transition = 'none';
    bar.style.width = '0';
  });
}

function animateSkillBars() {
  skillBars.forEach((bar, i) => {
    setTimeout(() => {
      bar.style.transition = 'width 1s ease-out';
      bar.style.width = bar.dataset.width;
    }, i * 100);
  });
}

const skillsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateSkillBars();
    } else {
      resetSkillBars();
    }
  });
}, { threshold: 0.3 });

const skillsSection = document.querySelector('#skills');
if (skillsSection) skillsObserver.observe(skillsSection);


// ── Timeline item animations ──────────────────────────────────────────────────

const timelineContent = document.querySelector('#timeline .timeline-content');
const timelineWrapper  = document.querySelector('.timeline-wrapper');
const items = document.querySelectorAll('.timeline-content li');

const itemObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  });
}, { root: timelineContent, threshold: 0.1 });

items.forEach(item => itemObserver.observe(item));


// ── Timeline scroll arrows ────────────────────────────────────────────────────

const updateTimelineArrows = () => {
  if (!timelineContent || !timelineWrapper) return;
  const { scrollTop, scrollHeight, clientHeight } = timelineContent;
  timelineWrapper.classList.toggle('can-scroll-down', scrollTop + clientHeight < scrollHeight - 1);
  timelineWrapper.classList.toggle('can-scroll-up', scrollTop > 1);
};

if (timelineContent) {
  timelineContent.addEventListener('scroll', updateTimelineArrows);
}

window.addEventListener('load', updateTimelineArrows);
window.addEventListener('resize', updateTimelineArrows);
