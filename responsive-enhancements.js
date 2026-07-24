(() => {
    const nav = document.getElementById('navbar');
    const menu = document.getElementById('mobile-menu');
    const toggle = nav?.querySelector('button[onclick="toggleMenu()"]');

    if (!nav || !menu || !toggle) return;

    const languageButtons = [
        document.getElementById('btn-en'),
        document.getElementById('btn-fr')
    ].filter(Boolean);

    languageButtons.forEach(button => {
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                button.click();
            }
        });
    });

    const originalSetLanguage = window.setLanguage;
    window.setLanguage = lang => {
        originalSetLanguage?.(lang);
        const resume = lang === 'fr' ? 'mgr_resume_fr.pdf' : 'mgr_resume_eng.pdf';
        document.getElementById('cv-link')?.setAttribute('href', resume);
        document.getElementById('cv-link-mobile')?.setAttribute('href', resume);
        languageButtons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.id === `btn-${lang}`));
        });
    };
    languageButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.id === 'btn-en'));
    });

    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.setAttribute('aria-controls', 'mobile-menu');
    toggle.setAttribute('aria-expanded', 'false');

    const syncMenuState = () => {
        const isOpen = !menu.classList.contains('hidden');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !isOpen);
            icon.classList.toggle('fa-xmark', isOpen);
        }
        document.body.style.overflow = isOpen && window.innerWidth < 768 ? 'hidden' : '';
    };

    const originalToggleMenu = window.toggleMenu;
    window.toggleMenu = () => {
        originalToggleMenu?.();
        syncMenuState();
    };

    const closeMenu = () => {
        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            syncMenuState();
        }
    };

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu();
            toggle.focus();
        }
    });

    document.addEventListener('click', event => {
        if (!nav.contains(event.target)) closeMenu();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) closeMenu();
    }, { passive: true });

    const updateNavbar = () => {
        nav.classList.toggle('nav-scrolled', window.scrollY > 12);
    };

    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.AOS) {
        window.AOS.init({ disable: true });
    }
})();
