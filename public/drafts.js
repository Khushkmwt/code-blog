(function () {
    'use strict';

    const form = document.querySelector('form[action="/api/v1/post/create"]');
    if (!form) return;

    const idInput = form.querySelector('#draftId');
    const titleInput = form.querySelector('#title');
    const descInput = form.querySelector('#desc');
    const detailInput = form.querySelector('#detail');
    const tagsInput = form.querySelector('#tags');
    const statusLine = document.getElementById('draft-status');
    if (!idInput || !titleInput || !detailInput) return;

    let saving = false;
    let lastSaved = 0;

    const setStatus = (text, tone) => {
        if (!statusLine) return;
        statusLine.textContent = text;
        statusLine.classList.toggle('text-brand', tone === 'ok');
        statusLine.classList.toggle('text-danger', tone === 'err');
    };

    const collect = () => ({
        title: titleInput.value,
        desc: descInput ? descInput.value : '',
        detail: detailInput.value,
        tags: tagsInput ? tagsInput.value : '',
        draftId: idInput.value,
    });

    const saveDraft = () => {
        if (saving) return;
        const data = collect();
        if (!data.title.trim()) {
            setStatus('Add a title to start autosaving drafts');
            return;
        }

        saving = true;
        setStatus('Autosaving…');
        fetch('/api/v1/post/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Autosave failed');
                return res.json();
            })
            .then((body) => {
                if (body?.data?.postId) {
                    idInput.value = body.data.postId;
                    lastSaved = Date.now();
                    setStatus('Autosaved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'ok');
                }
            })
            .catch(() => setStatus('Autosave failed — check your connection', 'err'))
            .finally(() => {
                saving = false;
            });
    };

    form.addEventListener('input', () => {
        if (Date.now() - lastSaved >= 15000) saveDraft();
    });

    window.setInterval(saveDraft, 30000);
})();