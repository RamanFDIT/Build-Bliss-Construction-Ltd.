// Mobile navigation toggle logic
(function(){
  function init(){
    const toggleBtn = document.getElementById('menuToggle');
    const closePanelBtn = document.getElementById('closePanel');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');
    const iconOpen = document.getElementById('iconOpen');
    const iconClose = document.getElementById('iconClose');

    if(!toggleBtn || !mobileNav || !overlay) return;

    // Initial ARIA state
    mobileNav.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');

    let isOpen = false;
    let lastFocused = null;

    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function lockScroll(){
      document.documentElement.classList.add('overflow-hidden','touch-pan-y');
      document.body.classList.add('overflow-hidden');
    }
    function unlockScroll(){
      document.documentElement.classList.remove('overflow-hidden','touch-pan-y');
      document.body.classList.remove('overflow-hidden');
    }

    function openMenu(){
      if(isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;
      toggleBtn.setAttribute('aria-expanded','true');
      mobileNav.classList.remove('translate-x-full');
      overlay.classList.remove('pointer-events-none');
      overlay.classList.add('opacity-100');
      mobileNav.setAttribute('aria-hidden','false');
      overlay.setAttribute('aria-hidden','false');
      iconOpen.classList.add('hidden');
      iconClose.classList.remove('hidden');
      lockScroll();
      const firstFocusable = mobileNav.querySelector(focusableSelectors);
      if(firstFocusable) firstFocusable.focus();
      document.addEventListener('keydown', handleKeydown);
    }

    function closeMenu(){
      if(!isOpen) return;
      isOpen = false;
      toggleBtn.setAttribute('aria-expanded','false');
      mobileNav.classList.add('translate-x-full');
      overlay.classList.add('pointer-events-none');
      overlay.classList.remove('opacity-100');
      mobileNav.setAttribute('aria-hidden','true');
      overlay.setAttribute('aria-hidden','true');
      iconClose.classList.add('hidden');
      iconOpen.classList.remove('hidden');
      unlockScroll();
      document.removeEventListener('keydown', handleKeydown);
      if(lastFocused) lastFocused.focus();
    }

    function handleKeydown(e){
      if(e.key === 'Escape') {
        closeMenu();
      } else if(e.key === 'Tab' && isOpen){
        const focusable = Array.from(mobileNav.querySelectorAll(focusableSelectors)).filter(el=>!el.hasAttribute('disabled'));
        if(focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault();
          last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault();
          first.focus();
        }
      }
    }

    toggleBtn.addEventListener('click', ()=>{ isOpen ? closeMenu() : openMenu(); });
    if(closePanelBtn){ closePanelBtn.addEventListener('click', closeMenu); }
    overlay.addEventListener('click', closeMenu);
    window.addEventListener('hashchange', closeMenu);

    // Auto-close mobile menu when a link inside it is tapped/clicked
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Defer closing slightly to allow native hash scrolling to compute position
        setTimeout(closeMenu, 10);
      });
    });

    /* Click-to-toggle overlays for projects & services on small/medium screens */
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    const serviceCards = Array.from(document.querySelectorAll('.service-card'));
    const mq = window.matchMedia('(min-width: 1024px)'); // lg breakpoint

    function clearActive(collection){
      collection.forEach(el=>el.classList.remove('active'));
    }

    function enableClickMode(){
      projectCards.forEach(card=>{
        card.addEventListener('click', projectHandler);
        card.classList.add('cursor-pointer');
      });
      serviceCards.forEach(card=>{
        card.addEventListener('click', serviceHandler);
        card.classList.add('cursor-pointer');
      });
    }

    function disableClickMode(){
      projectCards.forEach(card=>{
        card.removeEventListener('click', projectHandler);
        card.classList.remove('active','cursor-pointer');
      });
      serviceCards.forEach(card=>{
        card.removeEventListener('click', serviceHandler);
        card.classList.remove('active','cursor-pointer');
      });
    }

    function projectHandler(e){
      // Prevent nested clicks from double toggling
      e.stopPropagation();
      const card = this;
      const isActive = card.classList.contains('active');
      clearActive(projectCards);
      if(!isActive) card.classList.add('active');
    }

    function serviceHandler(e){
      e.stopPropagation();
      const card = this;
      const isActive = card.classList.contains('active');
      clearActive(serviceCards);
      if(!isActive) card.classList.add('active');
    }

    function evaluateMode(){
      if(mq.matches){
        disableClickMode(); // on large screens rely on hover
      } else {
        enableClickMode();
      }
    }

    evaluateMode();
    mq.addEventListener('change', evaluateMode);
    document.addEventListener('click', (e)=>{
      if(!mq.matches){
        // clicking outside closes all when in click mode
        if(!(e.target.closest('.project-card') || e.target.closest('.service-card'))){
          clearActive(projectCards);
          clearActive(serviceCards);
        }
      }
    });

    // Contact form mailto handler
    const contactForm = document.getElementById('contactForm');
    if(contactForm){
      contactForm.addEventListener('submit', function(e){
        e.preventDefault();
        const name = (this.querySelector('#name')?.value || '').trim();
        const email = (this.querySelector('#email')?.value || '').trim();
        const message = (this.querySelector('#message')?.value || '').trim();
        const recipient = 'buildblissconstructionltd@gmail.com'; // change to your Gmail if different
        const subject = encodeURIComponent(`Website Inquiry from ${name || 'Visitor'}`);
        const bodyLines = [
          `Name: ${name}`,
          `Email: ${email}`,
          '',
          'Message:',
          message
        ];
        const body = encodeURIComponent(bodyLines.join('\n'));
        const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
        // Open default mail client
        window.location.href = mailtoUrl;
        // Optional: provide quick feedback
        this.reset();
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  
  /* ------------------ Scroll Reveal Logic ------------------ */
  function startReveal(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // bail for reduced motion
    const toReveal = Array.from(document.querySelectorAll('[data-reveal]'));
    if(!('IntersectionObserver' in window) || toReveal.length === 0) {
      toReveal.forEach(el=>el.classList.add('reveal-visible'));
      return;
    }
    const initialWindowHeight = window.innerHeight || document.documentElement.clientHeight;
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const el = entry.target;
          const delay = el.getAttribute('data-delay');
          if(delay){
            el.style.setProperty('--reveal-delay', (parseInt(delay,10)/1000)+ 's');
          }
          el.classList.add('reveal-visible');
          obs.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    // Observe all & immediately show anything already in viewport
    toReveal.forEach(el=>{
      const rect = el.getBoundingClientRect();
      if(rect.top < initialWindowHeight * 0.9){
        // treat as intersecting immediately
        const delay = el.getAttribute('data-delay');
        if(delay){
          el.style.setProperty('--reveal-delay', (parseInt(delay,10)/1000)+ 's');
        }
        el.classList.add('reveal-visible');
      } else {
        obs.observe(el);
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', startReveal, { once: true });
  } else {
    startReveal();
  }
})();