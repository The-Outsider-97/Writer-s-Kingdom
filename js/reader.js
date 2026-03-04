(() => {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const fileListEl = document.getElementById('fileList');
    const viewerTitle = document.getElementById('viewerTitle');
    const viewerContent = document.getElementById('viewerContent');
    const viewerHeightRange = document.getElementById('viewerHeightRange');
    const fitViewerBtn = document.getElementById('fitViewerBtn');
    const commentListEl = document.getElementById('commentList');
    const commentInput = document.getElementById('commentInput');
    const commentPageInput = document.getElementById('commentPageInput');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const readModeToggle = document.getElementById('readModeToggle');
    const readerLayout = document.querySelector('.reader-layout');
    const libraryPanel = document.getElementById('libraryPanel');
    const STORAGE_KEY = 'wk_reader_state_v2';

    if (!uploadBtn) return;

    const files = [];
    let currentFileId = null;
    let readModeActive = false;
    let viewerHeight = Number(viewerHeightRange?.value || 520);

    const generateId = () => '_' + Math.random().toString(36).slice(2, 11);

    const escapeHtml = (unsafe = '') => unsafe.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

    function applyViewerHeight(height) {
        const normalized = Math.max(320, Math.min(1000, Number(height) || 520));
        viewerHeight = normalized;
        viewerContent.style.setProperty('--viewer-height', `${normalized}px`);
        if (viewerHeightRange) {
            viewerHeightRange.value = String(normalized);
        }
    }

    function fitViewerToDocument() {
        const file = files.find((f) => f.id === currentFileId);
        if (!file) return;

        let targetHeight = 520;
        if (file.type === 'application/pdf') {
            targetHeight = 900;
        } else {
            const contentHeight = viewerContent.scrollHeight + 32;
            targetHeight = Math.max(420, Math.min(1000, contentHeight));
        }

        applyViewerHeight(targetHeight);
        saveState();
    }

    function saveState() {
        const state = {
            files,
            currentFileId,
            readModeActive,
            viewerHeight
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) {
            applyViewerHeight(viewerHeight);
            return;
        }

        try {
            const state = JSON.parse(rawState);
            if (!Array.isArray(state.files)) return;

            state.files.forEach((file) => {
                files.push({
                    id: file.id || generateId(),
                    name: file.name || 'Untitled',
                    type: file.type || 'text/plain',
                    extension: file.extension || 'TXT',
                    comments: Array.isArray(file.comments)
                        ? file.comments.map((comment) => ({
                            text: comment.text || '',
                            timestamp: comment.timestamp || new Date().toLocaleString(),
                            page: Number.isInteger(comment.page) && comment.page > 0 ? comment.page : null
                        }))
                        : [],
                    content: file.content || null,
                    pdfDataUrl: file.pdfDataUrl || null
                });
            });

            if (typeof state.currentFileId === 'string' && files.some((f) => f.id === state.currentFileId)) {
                currentFileId = state.currentFileId;
            }

            readModeActive = Boolean(state.readModeActive);
            applyViewerHeight(state.viewerHeight);
            readModeToggle.innerHTML = readModeActive ? '<i class="fas fa-eye-slash"></i> Normal mode' : '<i class="fas fa-eye"></i> Read mode';
        } catch {
            localStorage.removeItem(STORAGE_KEY);
            applyViewerHeight(viewerHeight);
        }
    }

    function renderFileList() {
        if (!files.length) {
            fileListEl.innerHTML = '<li class="muted">No files yet — upload something.</li>';
            return;
        }

        fileListEl.innerHTML = files.map((file) => `
            <li data-id="${file.id}" class="${currentFileId === file.id ? 'active' : ''}">
                <strong>${escapeHtml(file.name)}</strong>
                <div class="muted">${file.extension}</div>
            </li>`).join('');

        fileListEl.querySelectorAll('li[data-id]').forEach((li) => {
            li.addEventListener('click', () => selectFile(li.dataset.id));
        });
    }

    function renderComments(file) {
        if (!file?.comments?.length) {
            commentListEl.innerHTML = '<div class="muted">No comments yet.</div>';
            return;
        }

        commentListEl.innerHTML = file.comments.map((c) => `
            <div class="comment-item">
                <div>${escapeHtml(c.text)}</div>
                ${c.page ? `<div class="comment-page-tag">Page ${c.page}</div>` : ''}
                <div class="comment-meta">${c.timestamp}</div>
            </div>
        `).join('');
    }

    function renderViewer() {
        const file = files.find((f) => f.id === currentFileId);
        if (!file) {
            viewerTitle.textContent = '📖 Select a file';
            viewerContent.innerHTML = '<div class="muted">Upload a .txt, .docx, or .pdf to begin.</div>';
            commentListEl.innerHTML = '';
            addCommentBtn.disabled = true;
            if (fitViewerBtn) fitViewerBtn.disabled = true;
            return;
        }

        viewerTitle.textContent = `📘 ${file.name}`;
        if (file.type === 'text/plain') {
            viewerContent.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(file.content)}</pre>`;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            viewerContent.innerHTML = file.content;
        } else if (file.type === 'application/pdf' && file.pdfDataUrl) {
            viewerContent.innerHTML = `<iframe class="pdf-frame" src="${file.pdfDataUrl}" title="PDF"></iframe>`;
        } else {
            viewerContent.textContent = 'Unsupported file.';
        }

        viewerContent.classList.toggle('read-mode', readModeActive);
        readerLayout?.classList.toggle('read-focus-active', readModeActive);
        libraryPanel?.classList.toggle('read-focus-dim', readModeActive);

        renderComments(file);
        addCommentBtn.disabled = false;
        if (fitViewerBtn) fitViewerBtn.disabled = false;
    }

    function selectFile(id) {
        currentFileId = id;
        renderFileList();
        renderViewer();
        saveState();
    }

    function addComment() {
        if (!currentFileId) return;
        const text = commentInput.value.trim();
        if (!text) return;

        const pageValue = commentPageInput.value.trim();
        const page = pageValue ? Number.parseInt(pageValue, 10) : null;

        if (pageValue && (!Number.isInteger(page) || page < 1)) {
            commentPageInput.focus();
            return;
        }

        const file = files.find((f) => f.id === currentFileId);
        if (!file) return;

        file.comments.push({
            text,
            timestamp: new Date().toLocaleString(),
            page
        });

        commentInput.value = '';
        commentPageInput.value = '';
        renderComments(file);
        saveState();
    }

    function handleUpload(file) {
        const reader = new FileReader();
        const fileObj = {
            id: generateId(),
            name: file.name,
            type: file.type,
            extension: file.name.split('.').pop().toUpperCase(),
            comments: [],
            pdfDataUrl: null,
            content: null
        };

        if (file.type === 'text/plain') {
            reader.onload = (e) => {
                fileObj.content = e.target.result;
                files.push(fileObj);
                selectFile(fileObj.id);
                renderFileList();
                saveState();
            };
            reader.readAsText(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            reader.onload = (e) => {
                mammoth.convertToHtml({ arrayBuffer: e.target.result })
                    .then((result) => {
                        fileObj.content = result.value;
                        files.push(fileObj);
                        selectFile(fileObj.id);
                        renderFileList();
                        saveState();
                    })
                    .catch(() => {
                        fileObj.content = '<p>Could not parse this DOCX file.</p>';
                        files.push(fileObj);
                        selectFile(fileObj.id);
                        renderFileList();
                        saveState();
                    });
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/pdf') {
            reader.onload = (e) => {
                fileObj.pdfDataUrl = e.target.result;
                files.push(fileObj);
                selectFile(fileObj.id);
                renderFileList();
                saveState();
            };
            reader.readAsDataURL(file);
        } else {
            alert('Only .pdf, .docx, .txt files are accepted.');
        }
    }

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(handleUpload);
        fileInput.value = '';
    });
    addCommentBtn.addEventListener('click', addComment);
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addComment();
        }
    });

    commentPageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addComment();
        }
    });

    viewerHeightRange?.addEventListener('input', () => {
        applyViewerHeight(viewerHeightRange.value);
        saveState();
    });

    fitViewerBtn?.addEventListener('click', fitViewerToDocument);

    readModeToggle.addEventListener('click', () => {
        readModeActive = !readModeActive;
        readModeToggle.innerHTML = readModeActive ? '<i class="fas fa-eye-slash"></i> Normal mode' : '<i class="fas fa-eye"></i> Read mode';
        renderViewer();
        saveState();
    });

    loadState();
    renderFileList();
    renderViewer();
})();
