(function () {
    'use strict';

    const md = window.markdownit ? window.markdownit({ html: false, breaks: true, linkify: true }) : null;

    document.querySelectorAll('[data-editor]').forEach((box) => {
        const source = box.querySelector('[data-editor-source]');
        const preview = box.querySelector('[data-editor-preview]');
        const tabs = box.querySelectorAll('[data-editor-tab]');
        if (!source || !preview || !tabs.length) return;

        const render = () => {
            if (!md) {
                preview.textContent = 'Preview unavailable.';
                return;
            }
            preview.innerHTML = md.render(source.value);
            if (window.hljs) {
                preview.querySelectorAll('pre code').forEach((el) => window.hljs.highlightElement(el));
            }
        };

        const setTab = (tab) => {
            const isPreview = tab === 'preview';
            tabs.forEach((btn) => {
                const active = btn.getAttribute('data-editor-tab') === tab;
                btn.classList.toggle('btn-filled', active);
                btn.classList.toggle('btn-ghost', !active);
            });
            source.classList.toggle('hidden', isPreview);
            preview.classList.toggle('hidden', !isPreview);
            if (isPreview) render();
        };

        const passive = box.querySelector('[data-editor-tab="write"]') ? 'write' : 'preview';
        setTab(passive);

        tabs.forEach((btn) => {
            btn.addEventListener('click', () => setTab(btn.getAttribute('data-editor-tab')));
        });

        let timer;
        source.addEventListener('input', () => {
            if (preview.classList.contains('hidden')) return;
            clearTimeout(timer);
            timer = setTimeout(render, 250);
        });
    });
})();