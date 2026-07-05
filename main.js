document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

const navCollapseEl = document.getElementById('navbarNav');
if (navCollapseEl) {
  const navLinks = navCollapseEl.querySelectorAll('.nav-link');
  const bsCollapse = new bootstrap.Collapse(navCollapseEl, { toggle: false });
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.getComputedStyle(document.querySelector('.navbar-toggler')).display !== 'none') {
        bsCollapse.hide();
      }
    });
  });
}

const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up, .fade-in, .fade-in-delay').forEach(el => fadeObserver.observe(el));

const gradeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.grade-fill').forEach(bar => {
        bar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
        bar.style.width = bar.getAttribute('style').match(/width:\s*(\d+%)/)[1];
      });
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.grade-bars').forEach(el => gradeObserver.observe(el));

let nudge;
let nudgeDismiss;
let nudgeTimer;

function scheduleThemeNudge(delay) {
  if (!nudge) return;
  const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';
  const alreadyDismissed = sessionStorage.getItem('nudgeDismissed');
  if (isLight && !alreadyDismissed) {
    nudgeTimer = setTimeout(() => {
      nudge.classList.add('visible');
    }, delay);
  }
}

document.querySelectorAll('a[href="SindhusreeResume.pdf"]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    window.open(this.href, '_blank');
    const a = document.createElement('a');
    a.href = this.href;
    a.download = 'SindhusreeResume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});

window.addEventListener('load', () => {
  const stage = document.getElementById('polaroidStage');
  if (stage) {
    stage.classList.add('js-enabled');
    setTimeout(() => {
      const items = Array.from(stage.querySelectorAll('.polaroid-item'));
      let completed = 0;

      const checkComplete = () => {
        completed += 1;
        if (completed === items.length) {
          scheduleThemeNudge(2000);
        }
      };

      items.forEach(p => {
        p.classList.add('in');
        p.addEventListener('animationend', function onIn(e) {
          if (e.animationName === 'fadeUpIn') {
            p.classList.add('floating');
            p.removeEventListener('animationend', onIn);
            checkComplete();
          }
        });
      });

      if (items.length === 0) {
        scheduleThemeNudge(2000);
      }
    }, 300);
  } else {
    scheduleThemeNudge(2000);
  }

});

document.getElementById('themeToggle').addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.classList.add('theme-transitioning');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      root.addEventListener('transitionend', () => root.classList.remove('theme-transitioning'), { once: true });
    });
  });
});

const msgInput     = document.getElementById('stickyMessage');
const authorInput  = document.getElementById('stickyAuthor');
const previewText  = document.getElementById('stickyPreviewText');
const previewBy    = document.getElementById('stickyPreviewAuthor');
const noteForm     = document.getElementById('stickyNoteForm');

function clearSendState() {
  const loading  = document.getElementById('vintageLoadingOverlay');
  const success  = document.getElementById('sentSuccessOverlay');
  const bar      = document.getElementById('vintageProgressBar');
  const pct      = document.getElementById('vintageProgressPercentage');
  if (loading)  loading.classList.add('d-none');
  if (success)  success.classList.add('d-none');
  if (bar)      bar.style.width = '0%';
  if (pct)      pct.textContent = '0%';
  previewText.classList.remove('d-none');
  previewBy.classList.remove('d-none');
}

if (msgInput && authorInput && previewText && previewBy) {
  msgInput.addEventListener('input', () => {
    clearSendState();
    let text  = msgInput.value;
    let words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length > 80) {
      text  = text.split(/\s+/).slice(0, 80).join(' ');
      words = text.trim().split(/\s+/).filter(Boolean);
      msgInput.value = text;
    }

    const count   = words.length;
    const counter = document.getElementById('stickyWordCounter');
    if (counter) {
      counter.textContent  = `${count} / 80 words`;
      counter.style.color  = count >= 70 ? '#e8527a' : 'var(--text-muted)';
      counter.style.fontWeight = count >= 70 ? '700' : 'normal';
    }

    let size = 2.1;
    if      (count > 60) size = 1.15;
    else if (count > 40) size = 1.35;
    else if (count > 20) size = 1.55;
    else if (count > 8)  size = 1.8;

    previewText.style.fontSize = `${size}rem`;
    previewText.textContent    = text || 'Start typing your note...';
  });

  authorInput.addEventListener('input', () => {
    clearSendState();
    previewBy.textContent = authorInput.value ? `— ${authorInput.value}` : '— Guest';
  });
}

if (noteForm) {
  noteForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const loading = document.getElementById('vintageLoadingOverlay');
    const success = document.getElementById('sentSuccessOverlay');
    const bar     = document.getElementById('vintageProgressBar');
    const pct     = document.getElementById('vintageProgressPercentage');

    if (!loading || !bar || !pct) return;

    previewText.classList.add('d-none');
    previewBy.classList.add('d-none');
    loading.classList.remove('d-none');

    let progress = 0;
    const tick = 125;
    const step = 100 / (2500 / tick);

    const timer = setInterval(() => {
      progress = Math.min(progress + step, 100);
      bar.style.width   = `${progress}%`;
      pct.textContent   = `${Math.round(progress)}%`;

      if (progress >= 100) {
        clearInterval(timer);
        loading.classList.add('d-none');
        if (success) success.classList.remove('d-none');
        noteForm.reset();
        const counter = document.getElementById('stickyWordCounter');
        if (counter) {
          counter.textContent  = '0 / 80 words';
          counter.style.color  = 'var(--text-muted)';
          counter.style.fontWeight = 'normal';
        }
      }
    }, tick);

    fetch(noteForm.action, {
      method: 'POST',
      body: new FormData(noteForm),
      headers: { Accept: 'application/json' }
    }).catch(err => console.error('Send failed:', err));
  });
}

nudge = document.getElementById('themeNudge');
nudgeDismiss = document.getElementById('themeNudgeDismiss');

function hideNudge() {
  if (nudgeTimer) {
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }
  nudge.classList.remove('visible');
  nudge.classList.add('hiding');
  setTimeout(() => nudge.classList.remove('hiding'), 400);
}

if (nudge && nudgeDismiss) {
  const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';
  const alreadyDismissed = sessionStorage.getItem('nudgeDismissed');

  if (isLight && !alreadyDismissed) {
    nudgeDismiss.addEventListener('click', () => {
      sessionStorage.setItem('nudgeDismissed', '1');
      hideNudge();
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      setTimeout(() => {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
          sessionStorage.setItem('nudgeDismissed', '1');
          hideNudge();
        }
      }, 50);
    }, true);
  }
}

// ===== Skills Explorer Desktop Tab Switcher =====
document.addEventListener('DOMContentLoaded', () => {
  const skillsNavItems = document.querySelectorAll('.skills-nav-item');
  const skillsPanels = document.querySelectorAll('.skills-panel');

  if (skillsNavItems.length > 0 && skillsPanels.length > 0) {
    skillsNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetCat = item.getAttribute('data-category');
        
        // Update nav active class
        skillsNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update panels visibility
        skillsPanels.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === `panel-${targetCat}`) {
            panel.classList.add('active');
          }
        });
      });
    });
  }
});

// ===== Back to Top Button Logic =====
document.addEventListener('DOMContentLoaded', () => {
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

// ===== Custom Scrollspy Logic =====
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-collapse .nav-link');

  function updateActiveLink() {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 180; // 180px offset for dynamic navbar height

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    // Fallback: at the top of the page, keep 'about' highlighted
    if (window.scrollY < 120) {
      currentSectionId = 'about';
    }

    // Fallback: scrolled to the bottom of the page, highlight the last section
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
      if (sections.length > 0) {
        currentSectionId = sections[sections.length - 1].getAttribute('id');
      }
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${currentSectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink(); // run initially
});
