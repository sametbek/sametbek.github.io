const nav = document.getElementById('pageNav');
const scrollTopBtn = document.querySelector('.scroll-top-btn');
const projectCards = document.querySelectorAll('.project-mini-card');
const welcomeImage = document.querySelector('.about-hero-image');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;

  if (currentScrollY > lastScrollY && currentScrollY > 120) {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
  }

  if (welcomeImage) {
    const offset = Math.max(-120, Math.min(0, currentScrollY * -0.14));
    welcomeImage.style.transform = `translateY(${offset}px)`;
  }

  lastScrollY = currentScrollY;
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initLinkedinFallback() {
  const badge = document.querySelector('.badge-base');
  const fallback = document.querySelector('.linkedin-fallback');

  if (!badge || !fallback) return;

  const hideFallback = () => {
    fallback.style.display = 'none';
  };

  const showFallback = () => {
    fallback.style.display = 'inline-flex';
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hideFallback();
        observer.disconnect();
        return;
      }
    }
  });

  observer.observe(badge, { childList: true, subtree: true });

  setTimeout(() => {
    const hasEmbed = badge.querySelector('iframe, img, svg, .LI-profile-badge');
    if (!hasEmbed || badge.childElementCount <= 1) {
      showFallback();
    } else {
      hideFallback();
    }
    observer.disconnect();
  }, 1400);
}

function createStaticBackground(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      resolve(`url("${canvas.toDataURL('image/webp')}")`);
    };
    img.onerror = () => resolve(`url("${url}")`);
    img.src = url;
  });
}

async function initProjectCardBackgrounds() {
  for (const card of projectCards) {
    const animatedUrl = card.classList.contains('project-mini-card--coding')
      ? 'pictures/coding.webp'
      : card.classList.contains('project-mini-card--chip')
        ? 'pictures/chip.webp'
        : card.classList.contains('project-mini-card--energy')
          ? 'pictures/energy.webp'
          : 'pictures/website.webp';

    const staticUrl = await createStaticBackground(animatedUrl);
    card.style.setProperty('--card-bg', staticUrl);

    card.addEventListener('mouseenter', () => {
      card.style.setProperty('--card-bg', `url("${animatedUrl}")`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--card-bg', staticUrl);
    });
  }
}

if (projectCards.length) {
  initProjectCardBackgrounds();
}

initLinkedinFallback();

document.getElementById('go-to-fishing-btn').addEventListener('click', function(e) {
    e.preventDefault();
    
    const contentElements = document.querySelectorAll('body > *:not(script):not(nav)');
    
    contentElements.forEach(el => {
        el.style.transition = "opacity 1.5s ease";
        el.style.opacity = "0";
    });
    
    setTimeout(() => {
        window.location.href = "/fishing";
    }, 1500);
});
