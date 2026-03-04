(() => {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const fileListEl = document.getElementById('fileList');
    const viewerTitle = document.getElementById('viewerTitle');
    const viewerContent = document.getElementById('viewerContent');
    const commentListEl = document.getElementById('commentList');
    const commentInput = document.getElementById('commentInput');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const readModeToggle = document.getElementById('readModeToggle');

    if (!uploadBtn) return;

    const files = [];
    let currentFileId = null;
    let readModeActive = false;

    const generateId = () => '_' + Math.random().toString(36).slice(2, 11);

    const escapeHtml = (unsafe = '') => unsafe.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

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
            <div class="comment-item">${escapeHtml(c.text)}<div class="comment-meta">${c.timestamp}</div></div>
        `).join('');
    }

    function renderViewer() {
        const file = files.find((f) => f.id === currentFileId);
        if (!file) {
            viewerTitle.textContent = '📖 Select a file';
            viewerContent.innerHTML = '<div class="muted">Upload a .txt, .docx, or .pdf to begin.</div>';
            commentListEl.innerHTML = '';
            addCommentBtn.disabled = true;
            return;
        }

        viewerTitle.textContent = `📘 ${file.name}`;
        if (file.type === 'text/plain') {
            viewerContent.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(file.content)}</pre>`;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            viewerContent.innerHTML = file.content;
        } else if (file.type === 'application/pdf' && file.blobUrl) {
            viewerContent.innerHTML = `<iframe class="pdf-frame" src="${file.blobUrl}" title="PDF"></iframe>`;
        } else {
            viewerContent.textContent = 'Unsupported file.';
        }

        viewerContent.classList.toggle('read-mode', readModeActive);
        renderComments(file);
        addCommentBtn.disabled = false;
    }

    function selectFile(id) {
        currentFileId = id;
        renderFileList();
        renderViewer();
    }

    function addComment() {
        if (!currentFileId) return;
        const text = commentInput.value.trim();
        if (!text) return;

        const file = files.find((f) => f.id === currentFileId);
        if (!file) return;

        file.comments.push({
            text,
            timestamp: new Date().toLocaleString()
        });

        commentInput.value = '';
        renderComments(file);
    }

    function handleUpload(file) {
        const reader = new FileReader();
        const fileObj = {
            id: generateId(),
            name: file.name,
            type: file.type,
            extension: file.name.split('.').pop().toUpperCase(),
            comments: [],
            blobUrl: null,
            content: null
        };

        if (file.type === 'text/plain') {
            reader.onload = (e) => {
                fileObj.content = e.target.result;
                files.push(fileObj);
                selectFile(fileObj.id);
                renderFileList();
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
                    })
                    .catch(() => {
                        fileObj.content = '<p>Could not parse this DOCX file.</p>';
                        files.push(fileObj);
                        selectFile(fileObj.id);
                        renderFileList();
                    });
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/pdf') {
            reader.onload = (e) => {
                fileObj.blobUrl = URL.createObjectURL(new Blob([e.target.result], { type: 'application/pdf' }));
                files.push(fileObj);
                selectFile(fileObj.id);
                renderFileList();
            };
            reader.readAsArrayBuffer(file);
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
    readModeToggle.addEventListener('click', () => {
        readModeActive = !readModeActive;
        readModeToggle.innerHTML = readModeActive ? '<i class="fas fa-eye-slash"></i> Normal mode' : '<i class="fas fa-eye"></i> Read mode';
        renderViewer();
    });

    renderFileList();
    renderViewer();
})();