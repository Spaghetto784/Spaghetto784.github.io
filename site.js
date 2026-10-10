/* Matthieu Greiner — portfolio runtime
   Springs, i18n, navigation, scroll effects and the research sheet. */
(() => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ───────── Springs (damping ratio + response, interruptible, velocity-aware) ───────── */

    const active = new Set();
    let lastTime = 0;
    let rafId = 0;

    function tick(now) {
        const dt = Math.min((now - lastTime) / 1000, 1 / 30);
        lastTime = now;
        for (const spring of [...active]) spring.step(dt);
        rafId = active.size ? requestAnimationFrame(tick) : 0;
    }

    class Spring {
        constructor(value = 0, { response = 0.4, damping = 1 } = {}) {
            this.x = value;
            this.v = 0;
            this.target = value;
            this.response = response;
            this.damping = damping;
            this.onUpdate = null;
            this.onSettle = null;
        }

        set(value) {
            this.stop();
            this.x = this.target = value;
            this.v = 0;
            this.onUpdate?.(this.x);
        }

        to(target, { velocity, response, damping } = {}) {
            if (velocity !== undefined) this.v = velocity;
            if (response !== undefined) this.response = response;
            if (damping !== undefined) this.damping = damping;
            this.target = target;
            if (!active.has(this)) {
                active.add(this);
                if (!rafId) {
                    lastTime = performance.now();
                    rafId = requestAnimationFrame(tick);
                }
            }
        }

        stop() {
            active.delete(this);
        }

        step(dt) {
            const omega = (2 * Math.PI) / this.response;
            const stiffness = omega * omega;
            const drag = 2 * this.damping * omega;
            const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
            const h = dt / steps;
            for (let i = 0; i < steps; i++) {
                this.v += (-stiffness * (this.x - this.target) - drag * this.v) * h;
                this.x += this.v * h;
            }
            if (Math.abs(this.x - this.target) < 0.05 && Math.abs(this.v) < 1) {
                this.x = this.target;
                this.v = 0;
                active.delete(this);
                this.onUpdate?.(this.x);
                this.onSettle?.();
                return;
            }
            this.onUpdate?.(this.x);
        }
    }

    const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);
    const rubberband = (overshoot, dimension, constant = 0.55) =>
        (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

    /* ───────── i18n (EN lives in the markup, FR in dictionaries) ───────── */

    const i18n = (() => {
        const fr = Object.create(null);
        const originals = new WeakMap();
        const listeners = [];
        const meta = { title: document.title, description: $('meta[name="description"]')?.content ?? '' };
        let lang = 'en';

        const remember = el => {
            if (!originals.has(el)) originals.set(el, { html: el.innerHTML, attrs: {} });
            return originals.get(el);
        };

        function apply(next, { persist = true } = {}) {
            lang = next === 'fr' ? 'fr' : 'en';
            document.documentElement.lang = lang;

            $$('[data-i18n]').forEach(el => {
                const saved = remember(el);
                const key = el.dataset.i18n;
                const next = lang === 'fr' && key in fr ? fr[key] : saved.html;
                if (el.innerHTML !== next) el.innerHTML = next;
            });

            $$('[data-i18n-attr]').forEach(el => {
                const saved = remember(el);
                el.dataset.i18nAttr.split(';').forEach(pair => {
                    const [attr, key] = pair.split(':').map(part => part.trim());
                    if (!attr || !key) return;
                    if (!(attr in saved.attrs)) saved.attrs[attr] = el.getAttribute(attr) ?? '';
                    el.setAttribute(attr, lang === 'fr' && key in fr ? fr[key] : saved.attrs[attr]);
                });
            });

            document.title = lang === 'fr' && fr.__title ? fr.__title : meta.title;
            const description = $('meta[name="description"]');
            if (description) description.content = lang === 'fr' && fr.__description ? fr.__description : meta.description;

            $$('.lang button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
            $$('[data-cv]').forEach(link => link.setAttribute('href', lang === 'fr' ? 'mgr_resume_fr.pdf' : 'mgr_resume_eng.pdf'));

            if (persist) {
                try { localStorage.setItem('portfolioLanguage', lang); } catch (error) { /* storage unavailable */ }
            }
            listeners.forEach(listener => listener(lang));
            document.documentElement.classList.remove('fr-pending');
        }

        function initial() {
            try {
                const stored = localStorage.getItem('portfolioLanguage');
                if (stored === 'fr' || stored === 'en') return stored;
            } catch (error) { /* storage unavailable */ }
            return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
        }

        return {
            register: dictionary => Object.assign(fr, dictionary),
            apply,
            initial,
            onChange: listener => listeners.push(listener),
            missing: () => {
                const keys = $$('[data-i18n]').map(el => el.dataset.i18n);
                $$('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(pair => keys.push(pair.split(':')[1]?.trim())));
                return [...new Set(keys.filter(key => key && !(key in fr)))];
            },
            get lang() { return lang; },
        };
    })();

    /* ───────── Shared French strings ───────── */

    function registerBase() {
        i18n.register({
            skip: 'Aller au contenu',
            'nav-about': 'À propos', 'nav-exp': 'Parcours', 'nav-skills': 'Compétences', 'nav-projects': 'Projets', 'nav-now': 'Maintenant',
            'nav-cv': 'Mon CV', 'nav-resume': 'Mon CV', 'nav-book': 'Réserver un échange', 'nav-lang': 'Langue', 'nav-menu': 'Menu',
            'aria-email': 'E-mail', 'btn-book': 'Réserver un échange', 'btn-email': 'M’envoyer un e-mail', 'back-home': 'Retour au portfolio',
            'footer-built': 'Conçu avec', 'footer-and': 'et du code C. Hébergé sur'
        });
    }

    /* ───────── Navigation: scroll edge, active pill, language thumb, menu ───────── */

    function initNav() {
        const nav = $('.nav');
        if (!nav) return;

        const updateScrolled = () => nav.classList.toggle('scrolled', window.scrollY > 8);
        window.addEventListener('scroll', updateScrolled, { passive: true });
        updateScrolled();

        const linksBox = $('.nav-links', nav);
        const pill = $('.nav-pill', nav);
        const links = linksBox ? $$('a[data-nav]', linksBox) : [];
        const pillX = new Spring(0, { response: 0.42 });
        const pillW = new Spring(0, { response: 0.42 });
        let current = document.body.dataset.page || null;

        if (pill) {
            pillX.onUpdate = x => { pill.style.transform = `translate3d(${x}px,0,0)`; };
            pillW.onUpdate = w => { pill.style.width = `${w}px`; };
        }

        const mark = key => {
            [...links, ...$$('#menu a[data-nav]')].forEach(link => {
                if (link.dataset.nav === key) link.setAttribute('aria-current', link.getAttribute('href').endsWith('now.html') ? 'page' : 'true');
                else link.removeAttribute('aria-current');
            });
        };

        function placePill(animate) {
            if (!pill || !linksBox) return;
            const link = links.find(item => item.dataset.nav === current);
            if (!link || !linksBox.offsetWidth) { pill.classList.remove('on'); return; }
            const wasOn = pill.classList.contains('on');
            if (animate && wasOn) {
                pillX.to(link.offsetLeft);
                pillW.to(link.offsetWidth);
            } else {
                pillX.set(link.offsetLeft);
                pillW.set(link.offsetWidth);
            }
            pill.classList.add('on');
        }

        function setCurrent(key, animate = true) {
            if (key === current && pill?.classList.contains('on')) return;
            current = key;
            mark(key);
            placePill(animate && !reducedMotion.matches);
        }

        mark(current);

        if (document.body.dataset.page === 'home') {
            current = null;
            const sections = links.map(link => $(`#${link.dataset.nav}`)).filter(Boolean);
            if (sections.length && 'IntersectionObserver' in window) {
                const visible = new Map();
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
                    const hit = sections.find(section => visible.get(section.id));
                    setCurrent(hit ? hit.id : null);
                }, { rootMargin: '-45% 0px -50% 0px' });
                sections.forEach(section => observer.observe(section));
            }
        }

        /* language thumb */
        const lang = $('.lang', nav);
        const thumb = $('.lang-thumb', lang ?? nav);
        const thumbX = new Spring(0, { response: 0.38 });
        const thumbW = new Spring(0, { response: 0.38 });
        if (thumb) {
            thumbX.onUpdate = x => { thumb.style.transform = `translate3d(${x}px,0,0)`; };
            thumbW.onUpdate = w => { thumb.style.width = `${w}px`; };
        }

        function placeThumb(animate) {
            if (!thumb) return;
            const pressed = $('button[aria-pressed="true"]', lang);
            if (!pressed) return;
            if (animate && !reducedMotion.matches) {
                thumbX.to(pressed.offsetLeft);
                thumbW.to(pressed.offsetWidth);
            } else {
                thumbX.set(pressed.offsetLeft);
                thumbW.set(pressed.offsetWidth);
            }
        }

        $$('button[data-lang]', lang ?? nav).forEach(button => {
            button.addEventListener('click', () => {
                if (i18n.lang === button.dataset.lang) return;
                i18n.apply(button.dataset.lang);
                placeThumb(true);
            });
        });

        i18n.onChange(() => requestAnimationFrame(() => { placePill(false); placeThumb(false); }));

        const relayout = () => { placePill(false); placeThumb(false); };
        window.addEventListener('resize', relayout, { passive: true });
        document.fonts?.ready.then(relayout);
        relayout();

        /* mobile menu — materialises from its trigger and returns the same way */
        const button = $('.menu-btn', nav);
        const menu = $('#menu');
        if (button && menu) {
            const setMenu = open => {
                menu.classList.toggle('open', open);
                button.setAttribute('aria-expanded', String(open));
                menu.inert = !open;
            };
            menu.inert = true;
            button.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
            menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); button.focus(); }
            });
            document.addEventListener('pointerdown', event => {
                if (menu.classList.contains('open') && !menu.contains(event.target) && !button.contains(event.target)) setMenu(false);
            });
            window.matchMedia('(min-width: 64rem)').addEventListener('change', event => { if (event.matches) setMenu(false); });
        }
    }

    /* ───────── Scroll reveal, spotlight, timeline ───────── */

    function initReveal() {
        $$('[data-stagger]').forEach(parent => {
            [...parent.children].forEach((child, index) => {
                child.classList.add('reveal');
                child.style.setProperty('--i', index);
            });
        });
        const items = $$('.reveal');
        if (!('IntersectionObserver' in window)) { items.forEach(item => item.classList.add('in')); return; }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        items.forEach(item => observer.observe(item));
    }

    function initSpotlight() {
        let frame = 0;
        let pending = null;
        document.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse') return;
            const target = event.target.closest?.('.spot');
            if (!target) return;
            pending = { target, x: event.clientX, y: event.clientY };
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const rect = pending.target.getBoundingClientRect();
                pending.target.style.setProperty('--mx', `${pending.x - rect.left}px`);
                pending.target.style.setProperty('--my', `${pending.y - rect.top}px`);
            });
        }, { passive: true });
    }

    function initTimeline() {
        const timeline = $('.timeline');
        if (!timeline) return;
        const items = $$('.t-item', timeline);
        let queued = false;

        const update = () => {
            queued = false;
            const line = window.innerHeight * 0.58;
            const box = timeline.getBoundingClientRect();
            timeline.style.setProperty('--p', clamp((line - box.top) / box.height, 0, 1).toFixed(4));
            items.forEach(item => item.classList.toggle('on', item.getBoundingClientRect().top + 28 < line));
        };
        const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        update();
    }

    /* ───────── Sheet: 1:1 drag, velocity projection, rubber-banding, interruptible ───────── */

    function initSheets() {
        const scrim = $('.scrim');
        const sheets = $$('.sheet');
        if (!scrim || !sheets.length) return;

        const page = $$('.nav, main, .footer');
        const registry = new Map();
        let openSheet = null;

        sheets.forEach(sheet => {
            const head = $('.sheet-head', sheet);
            const body = $('.sheet-body', sheet);
            const closeButton = $('.sheet-close', sheet);
            const y = new Spring(0, { response: 0.4 });
            let isOpen = false;
            let lastFocus = null;
            let drag = null;

            const visibleHeight = () => Math.max(1, sheet.offsetHeight - 96);
            const closedY = () => sheet.offsetHeight;

            const render = value => {
                if (reducedMotion.matches) return;
                sheet.style.transform = `translate3d(0,${value}px,0)`;
                scrim.style.opacity = (1 - clamp(value / visibleHeight(), 0, 1)).toFixed(3);
            };
            y.onUpdate = render;

            const lock = on => {
                document.documentElement.style.overflow = on ? 'hidden' : '';
                page.forEach(el => { el.inert = on; });
            };

            const finishClose = () => {
                if (isOpen) return;
                sheet.classList.remove('visible', 'open');
                scrim.classList.remove('open');
                scrim.style.opacity = '';
                sheet.style.transform = '';
                lock(false);
                openSheet = null;
                lastFocus?.focus?.({ preventScroll: true });
            };
            y.onSettle = finishClose;

            function open(trigger) {
                if (isOpen) return;
                isOpen = true;
                openSheet = api;
                lastFocus = trigger || document.activeElement;
                const wasVisible = sheet.classList.contains('visible');
                sheet.classList.add('visible');
                scrim.classList.add('open');
                lock(true);
                body.scrollTop = 0;
                if (reducedMotion.matches) {
                    sheet.classList.add('open');
                    scrim.style.opacity = '1';
                } else {
                    sheet.classList.add('open');
                    if (!wasVisible) y.set(closedY());
                    y.to(0, { response: 0.42, damping: 1 });
                }
                requestAnimationFrame(() => closeButton?.focus({ preventScroll: true }));
            }

            function close(velocity = 0) {
                if (!isOpen) return;
                isOpen = false;
                sheet.classList.remove('open');
                if (reducedMotion.matches) {
                    scrim.style.opacity = '0';
                    setTimeout(finishClose, 230);
                } else {
                    y.to(closedY(), { velocity, response: 0.4, damping: 1 });
                }
            }

            const api = { open, close };
            registry.set(sheet.id, api);

            head.addEventListener('pointerdown', event => {
                if (event.button !== 0 || event.target.closest('button') || reducedMotion.matches) return;
                head.setPointerCapture(event.pointerId);
                head.classList.add('dragging');
                y.stop();
                if (!isOpen && sheet.classList.contains('visible')) {
                    isOpen = true;
                    openSheet = api;
                    sheet.classList.add('open');
                }
                drag = { startPointer: event.clientY, startY: y.x, samples: [{ t: event.timeStamp, y: event.clientY }] };
            });

            head.addEventListener('pointermove', event => {
                if (!drag) return;
                let next = drag.startY + (event.clientY - drag.startPointer);
                if (next < 0) next = -rubberband(-next, visibleHeight());
                y.set(next);
                drag.samples.push({ t: event.timeStamp, y: event.clientY });
                while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
            });

            const release = event => {
                if (!drag) return;
                const { samples } = drag;
                drag = null;
                head.classList.remove('dragging');
                const first = samples[0];
                const last = samples[samples.length - 1];
                const elapsed = last.t - first.t;
                const velocity = elapsed > 0 ? ((last.y - first.y) / elapsed) * 1000 : 0;
                const projected = y.x + project(velocity);
                if (event.type !== 'pointercancel' && projected > visibleHeight() * 0.5) {
                    close(velocity);
                } else {
                    y.to(0, { velocity, response: 0.34, damping: Math.abs(velocity) > 300 ? 0.82 : 1 });
                }
            };
            head.addEventListener('pointerup', release);
            head.addEventListener('pointercancel', release);

            closeButton?.addEventListener('click', () => close());
        });

        scrim.addEventListener('click', () => openSheet?.close());
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && openSheet) openSheet.close();
        });

        $$('[data-sheet-open]').forEach(trigger => {
            trigger.addEventListener('click', () => registry.get(trigger.dataset.sheetOpen)?.open(trigger));
        });
    }

    /* ───────── Boot ───────── */

    function boot() {
        document.documentElement.classList.add('js');
        registerBase();
        initNav();
        initReveal();
        initSpotlight();
        initTimeline();
        initSheets();
        i18n.apply(i18n.initial(), { persist: false });
    }

    window.Site = { Spring, i18n, project, rubberband, $, $$ };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
