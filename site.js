/* Matthieu Greiner, portfolio runtime
   Springs, i18n, theme, index tree, scroll reveals and the research sheet. */
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

        get running() {
            return active.has(this);
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
                const value = lang === 'fr' && key in fr ? fr[key] : saved.html;
                if (el.innerHTML !== value) el.innerHTML = value;
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

    function registerBase() {
        i18n.register({
            skip: 'Aller au contenu',
            'nav-index': 'Index', 'nav-cv': 'Mon CV', 'nav-book': 'Réserver un échange', 'nav-lang': 'Langue',
            'nav-theme': 'Mode sombre', 'nav-menu': 'Index du site', 'nav-folder': 'Ouvrir ou fermer le dossier',
            'aria-email': 'E-mail', 'btn-book': 'Réserver un échange', 'btn-email': 'M’envoyer un e-mail',
            'crumb-home': 'portfolio', 'footer-built': 'Conçu avec', 'footer-and': 'et du code C. Hébergé sur',
        });
    }

    /* ───────── Theme ───────── */

    const theme = (() => {
        const colors = { light: '#fbfaf6', dark: '#0e0e0c' };
        const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

        function apply(next, { persist = true, animate = false } = {}) {
            const root = document.documentElement;
            if (animate && !reducedMotion.matches) {
                root.classList.add('theme-anim');
                setTimeout(() => root.classList.remove('theme-anim'), 500);
            }
            root.dataset.theme = next;
            $('meta[name="theme-color"]')?.setAttribute('content', colors[next]);
            $$('.theme-btn').forEach(button => button.setAttribute('aria-checked', String(next === 'dark')));
            if (persist) {
                try { localStorage.setItem('portfolioTheme', next); } catch (error) { /* storage unavailable */ }
            }
        }

        return { apply, current };
    })();

    /* ───────── Index tree: folders open on springs, current location is marked ───────── */

    const normalize = path => path.replace(/index\.html$/, '').replace(/\/$/, '');

    function initTrees() {
        const rail = $('.rail .tree');
        const menu = $('#menu');
        if (!rail) return;

        if (menu) {
            const clone = rail.cloneNode(true);
            $('.menu-foot', menu)?.before(clone);
        }

        const trees = $$('.tree');
        const folders = new WeakMap();
        const manual = new Set();

        function folderState(item) {
            if (folders.has(item)) return folders.get(item);
            const list = $(':scope > .children', item);
            const spring = new Spring(0, { response: 0.4 });
            const state = { list, spring, open: false };
            spring.onUpdate = height => { list.style.height = `${height}px`; };
            spring.onSettle = () => {
                if (state.open) list.style.height = 'auto';
                else list.style.visibility = 'hidden';
            };
            folders.set(item, state);
            return state;
        }

        function setFolder(item, open, animate = true) {
            const state = folderState(item);
            const toggle = $(':scope > .trow > .caret', item);
            toggle?.setAttribute('aria-expanded', String(open));
            if (state.initialized && state.open === open) return;
            state.initialized = true;
            state.open = open;
            const { list, spring } = state;
            if (!animate || reducedMotion.matches) {
                spring.stop();
                list.style.height = open ? 'auto' : '0px';
                list.style.visibility = open ? 'visible' : 'hidden';
                list.inert = !open;
                return;
            }
            if (!spring.running) spring.x = list.offsetHeight;
            if (open) {
                list.style.visibility = 'visible';
                list.inert = false;
                spring.to(list.scrollHeight);
            } else {
                list.inert = true;
                spring.to(0);
            }
        }

        trees.forEach(tree => {
            $$('li.branch', tree).forEach(item => {
                setFolder(item, false, false);
                $(':scope > .trow > .caret', item)?.addEventListener('click', () => {
                    const next = !folderState(item).open;
                    if (next) manual.add(item); else manual.delete(item);
                    setFolder(item, next);
                });
            });
        });

        const railLinks = $$('a[href]', rail);
        const sameDocument = a => normalize(new URL(a.href, location.href).pathname) === normalize(location.pathname);
        const entries = railLinks
            .filter(sameDocument)
            .map(a => ({ a, hash: new URL(a.href, location.href).hash }));
        const withTarget = entries.filter(e => e.hash && $(e.hash));
        const pageRoot = entries.find(e => !e.hash)?.a ?? null;
        const isHome = document.body.dataset.page === 'home';

        let currentHref = null;
        function setActive(link) {
            const href = link?.getAttribute('href') ?? null;
            if (href === currentHref) return;
            currentHref = href;
            trees.forEach(tree => $$('a[href]', tree).forEach(a => {
                if (href && a.getAttribute('href') === href) a.setAttribute('aria-current', 'location');
                else a.removeAttribute('aria-current');
            }));
            trees.forEach(tree => {
                const activeItem = $('a[aria-current]', tree)?.closest('li.node');
                const activeFolder = activeItem?.classList.contains('branch') ? activeItem : activeItem?.parentElement?.closest('li.branch');
                $$('li.branch', tree).forEach(item => {
                    const wanted = item === activeFolder || manual.has(item);
                    if (folderState(item).open !== wanted) setFolder(item, wanted);
                });
            });
        }

        let queued = false;
        function update() {
            queued = false;
            const line = window.innerHeight * 0.38;
            let found = null;
            let best = -Infinity;
            for (const entry of withTarget) {
                const top = $(entry.hash).getBoundingClientRect().top;
                if (top <= line && top > best) { best = top; found = entry.a; }
            }
            if (!found) found = pageRoot ?? (isHome ? null : withTarget[0]?.a ?? null);
            setActive(found);
        }
        const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        update();
    }

    /* ───────── Bar: scroll edge, language, theme, index menu ───────── */

    function initBar() {
        const bar = $('.bar');
        if (!bar) return;

        const updateScrolled = () => bar.classList.toggle('scrolled', window.scrollY > 8);
        window.addEventListener('scroll', updateScrolled, { passive: true });
        updateScrolled();

        const lang = $('.lang', bar);
        const thumb = $('.lang-thumb', lang ?? bar);
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

        $$('button[data-lang]', lang ?? bar).forEach(button => {
            button.addEventListener('click', () => {
                if (i18n.lang === button.dataset.lang) return;
                i18n.apply(button.dataset.lang);
                placeThumb(true);
            });
        });

        i18n.onChange(() => requestAnimationFrame(() => placeThumb(false)));
        window.addEventListener('resize', () => placeThumb(false), { passive: true });
        document.fonts?.ready.then(() => placeThumb(false));
        placeThumb(false);

        $$('.theme-btn').forEach(button => {
            button.addEventListener('click', () => theme.apply(theme.current() === 'dark' ? 'light' : 'dark', { animate: true }));
        });

        const toggle = $('.index-btn', bar);
        const menu = $('#menu');
        if (toggle && menu) {
            const setMenu = open => {
                menu.classList.toggle('open', open);
                toggle.setAttribute('aria-expanded', String(open));
                menu.inert = !open;
            };
            menu.inert = true;
            toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
            menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); toggle.focus(); }
            });
            document.addEventListener('pointerdown', event => {
                if (menu.classList.contains('open') && !menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
            });
            window.matchMedia('(min-width: 68rem)').addEventListener('change', event => { if (event.matches) setMenu(false); });
        }
    }

    /* ───────── Scroll reveal ───────── */

    function initReveal() {
        $$('[data-stagger]').forEach(parent => {
            [...parent.children].forEach((child, index) => {
                child.classList.add('reveal');
                child.style.setProperty('--i', index);
            });
        });
        const items = $$('.reveal, .rule');
        if (!('IntersectionObserver' in window)) { items.forEach(item => item.classList.add('in')); return; }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
        items.forEach(item => observer.observe(item));
    }

    /* ───────── Sheet: 1:1 drag, velocity projection, rubber-banding, interruptible ───────── */

    function initSheets() {
        const scrim = $('.scrim');
        const sheets = $$('.sheet');
        if (!scrim || !sheets.length) return;

        const page = $$('.bar, .rail, main, .footer');
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
                sheet.classList.add('open');
                if (reducedMotion.matches) {
                    scrim.style.opacity = '1';
                } else {
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
        theme.apply(theme.current(), { persist: false });
        initBar();
        initTrees();
        initReveal();
        initSheets();
        i18n.apply(i18n.initial(), { persist: false });
    }

    window.Site = { Spring, i18n, theme, project, rubberband, $, $$ };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
