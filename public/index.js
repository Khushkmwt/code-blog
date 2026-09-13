(function () {
    'use strict';

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Dark mode ---------- */
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let dark = stored ? stored === 'dark' : prefersDark;

    const syncIcons = () => {
        document.querySelectorAll('[data-dark-icon="sun"]').forEach((el) => el.classList.toggle('hidden', !dark));
        document.querySelectorAll('[data-dark-icon="moon"]').forEach((el) => el.classList.toggle('hidden', dark));
    };
    const applyTheme = () => {
        root.classList.toggle('dark', dark);
        syncIcons();
    };
    applyTheme();

    document.querySelectorAll('[data-dark-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
            dark = !dark;
            localStorage.setItem('theme', dark ? 'dark' : 'light');
            applyTheme();
        });
    });

    /* ---------- Mobile menu ---------- */
    document.querySelectorAll('[data-mobile-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const menu = document.getElementById(btn.getAttribute('aria-controls'));
            if (!menu) return;
            const opening = menu.classList.toggle('hidden');
            btn.setAttribute('aria-expanded', String(opening));
            btn.classList.toggle('is-open', opening);
        });
    });

    /* ---------- Account dropdown ---------- */
    document.querySelectorAll('[data-menu-root]').forEach((rootEl) => {
        const toggle = rootEl.querySelector('[data-menu-toggle]');
        const menu = rootEl.querySelector('[data-menu]');
        if (!toggle || !menu) return;

        const close = () => {
            menu.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
        };

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const opening = menu.classList.toggle('hidden');
            toggle.setAttribute('aria-expanded', String(!opening));
        });

        document.addEventListener('click', (e) => {
            if (!rootEl.contains(e.target)) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    });

    /* ---------- Flash toasts ---------- */
    document.querySelectorAll('.toast').forEach((toast) => {
        const dismiss = () => {
            if (reduceMotion) {
                toast.remove();
                pruneContainer();
                return;
            }
            toast.classList.add('toast--leave');
            toast.addEventListener('animationend', () => {
                toast.remove();
                pruneContainer();
            }, { once: true });
        };
        const pruneContainer = () => {
            const box = document.getElementById('toast-container');
            if (box && !box.children.length) box.remove();
        };
        toast.querySelector('[data-toast-close]')?.addEventListener('click', dismiss);
        setTimeout(dismiss, reduceMotion ? 6000 : 4000);
    });

    /* ---------- Password visibility toggles ---------- */
    document.querySelectorAll('[data-pw-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.getAttribute('data-pw-toggle'));
            if (!input) return;
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.setAttribute('aria-pressed', String(show));
            btn.querySelector('[data-icon="eye"]')?.classList.toggle('hidden', show);
            btn.querySelector('[data-icon="eye-off"]')?.classList.toggle('hidden', !show);
        });
    });

    /* ---------- Debounced search ---------- */
    const searchInput = document.querySelector('[data-search-input]');
    if (searchInput) {
        const baseUrl = searchInput.getAttribute('data-search-action') || '/api/v1/blog';
        let lastValue = searchInput.value;
        let timer;

        const navigate = () => {
            const value = searchInput.value.trim();
            if (value === lastValue) return;
            lastValue = value;
            if (value) {
                window.location.assign(baseUrl + '?search=' + encodeURIComponent(value));
            } else {
                window.location.assign(baseUrl);
            }
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(navigate, 400);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(timer);
                navigate();
            }
        });
    }

    /* ---------- Form pending feedback ---------- */
    document.querySelectorAll('form[data-pending]').forEach((form) => {
        form.addEventListener('submit', () => {
            const btn = form.querySelector('[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Please wait…';
            }
        });
    });

    /* ---------- Character counter ---------- */
    document.querySelectorAll('[data-count-for]').forEach((el) => {
        const target = document.getElementById(el.getAttribute('data-count-for'));
        if (!target) return;
        const update = () => {
            el.textContent = `${target.value.length} / ${target.maxLength || '∞'}`;
        };
        update();
        target.addEventListener('input', update);
    });

    /* ---------- mailto contact form ---------- */
    document.querySelectorAll('form[data-mailto]').forEach((form) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.elements.name?.value || '';
            const email = form.elements.email?.value || '';
            const message = form.elements.message?.value || '';
            const subject = encodeURIComponent(`Message from ${name} (${email})`);
            const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
            window.location.href = `mailto:hello@code-blog.dev?subject=${subject}&body=${body}`;
            const btn = form.querySelector('[type="submit"]');
            if (btn) { btn.disabled = false; btn.textContent = 'Send message →'; }
        });
    });

    /* ---------- Confirm-password match ---------- */
    document.querySelectorAll('form[data-match-check]').forEach((form) => {
        const pw = form.querySelector('[data-match="pw"]');
        const confirm = form.querySelector('[data-match="confirm"]');
        if (!pw || !confirm) return;
        const msg = form.querySelector('[data-match-error]');

        const validate = () => {
            const ok = pw.value === confirm.value;
            confirm.setCustomValidity(ok ? '' : 'Passwords do not match.');
            if (msg) {
                msg.classList.toggle('hidden', ok || !confirm.value);
            }
            return ok;
        };

        confirm.addEventListener('input', validate);
        form.addEventListener('submit', (e) => {
            if (!validate()) e.preventDefault();
        });
    });

    /* ---------- Hero terminal typing ---------- */
    const typedEl = document.querySelector('[data-typed]');
    if (typedEl) {
        const phrases = JSON.parse(typedEl.getAttribute('data-phrases') || '["let the community build it"]');
        let phraseIdx = 0;
        let charIdx = 0;
        let deleting = false;

        const type = () => {
            const phrase = phrases[phraseIdx];
            if (!deleting) {
                charIdx++;
                typedEl.textContent = phrase.slice(0, charIdx);
                if (charIdx === phrase.length) {
                    if (reduceMotion) return;
                    setTimeout(() => { deleting = true; }, 1600);
                } else {
                    setTimeout(type, 55);
                }
            } else {
                charIdx--;
                typedEl.textContent = phrase.slice(0, charIdx);
                if (charIdx === 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    setTimeout(type, 250);
                } else {
                    setTimeout(type, 25);
                }
            }
        };

        if (reduceMotion) {
            typedEl.textContent = phrases[0];
        } else {
            type();
        }
    }

    /* ---------- Broken avatar fallback ---------- */
    document.addEventListener('error', (e) => {
        const target = e.target;
        if (target && target.tagName === 'IMG' && target.dataset.initial) {
            const fallback = document.createElement('span');
            fallback.className = (target.className || 'avatar-initial') + ' avatar-initial flex items-center justify-center';
            fallback.textContent = target.dataset.initial;
            target.replaceWith(fallback);
        }
    }, true);
})();