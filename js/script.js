function() {
    // ------ state ------
    let files = [];               // array of file objects
    let currentFileId = null;     // id of selected file
    let readModeActive = false;    // read mode toggle state

    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileListEl = document.getElementById('fileList');
    const viewerTitle = document.getElementById('viewerTitle');
    const viewerContent = document.getElementById('viewerContent');
    const commentListEl = document.getElementById('commentList');
    const commentInput = document.getElementById('commentInput');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const readModeToggle = document.getElementById('readModeToggle');

    // helper: unique id
    function generateId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 9); }

    // ------ render file list (left panel) ------
    function renderFileList() {
        if (!files.length) {
            fileListEl.innerHTML = '<li class="empty-state" style="list-style: none;">📭 no files yet</li>';
            return;
        }
        let html = '';
        files.forEach(f => {
            const activeClass = (currentFileId === f.id) ? 'active' : '';
            let icon = 'far fa-file';
            if (f.type === 'application/pdf') icon = 'far fa-file-pdf';
            else if (f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') icon = 'far fa-file-word';
            else if (f.type === 'text/plain') icon = 'far fa-file-alt';
            html += `<li class="file-item ${activeClass}" data-id="${f.id}">
                <i class="file-icon ${icon}"></i>
                <span class="file-name">${f.name}</span>
                <span class="file-type-badge">${f.extension}</span>
            </li>`;
        });
        fileListEl.innerHTML = html;

        // attach click listeners to each file item
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = item.dataset.id;
                if (id) selectFile(id);
            });
        });
    }

    // ------ render viewer and comments for current file ------
    function renderViewer() {
        if (!currentFileId) {
            viewerTitle.innerText = '📖 select a file';
            viewerContent.innerHTML = `<div class="empty-state">⬆️ no file selected</div>`;
            commentListEl.innerHTML = '';
            addCommentBtn.disabled = true;
            return;
        }

        const file = files.find(f => f.id === currentFileId);
        if (!file) return;

        viewerTitle.innerText = file.name;

        // show content based on type
        if (file.type === 'text/plain') {
            viewerContent.innerHTML = `<pre style="margin:0; font-family: 'Inter', monospace;">${escapeHtml(file.content || '')}</pre>`;
        }
        else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // content already stored as HTML from mammoth conversion
            viewerContent.innerHTML = file.content || '<p>— no readable content —</p>';
        }
        else if (file.type === 'application/pdf') {
            if (file.blobUrl) {
                viewerContent.innerHTML = `<iframe class="pdf-frame" src="${file.blobUrl}" title="PDF viewer"></iframe>`;
            } else {
                viewerContent.innerHTML = '<p>PDF cannot be displayed (no blob)</p>';
            }
        }
        else {
            viewerContent.innerHTML = '<p>unsupported file type</p>';
        }

        // re-apply read mode class if active
        if (readModeActive) {
            viewerContent.classList.add('read-mode');
        } else {
            viewerContent.classList.remove('read-mode');
        }

        // render comments
        renderComments(file);

        // enable comment button
        addCommentBtn.disabled = false;
    }

    function renderComments(file) {
        if (!file || !file.comments || !file.comments.length) {
            commentListEl.innerHTML = '<div class="empty-state" style="padding: 0.5rem;">💬 no comments yet</div>';
            return;
        }
        let html = '';
        file.comments.forEach(c => {
            html += `<div class="comment-item">
                ${escapeHtml(c.text)}
                <div class="comment-meta">${c.timestamp}</div>
            </div>`;
        });
        commentListEl.innerHTML = html;
    }

    // simple escape
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/[&<>"]/g, function(m) {
            if(m === '&') return '&amp;'; if(m === '<') return '&lt;'; if(m === '>') return '&gt;'; if(m === '"') return '&quot;';
            return m;
        });
    }

    // ------ select file by id ------
    function selectFile(id) {
        currentFileId = id;
        renderFileList();   // to update active class
        renderViewer();
    }

    // ------ add comment to current file ------
    function addComment() {
        if (!currentFileId) return;
        const text = commentInput.value.trim();
        if (!text) return;

        const file = files.find(f => f.id === currentFileId);
        if (file) {
            const timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' });
            file.comments.push({ text: text, timestamp: timestamp });
            renderComments(file);
            commentInput.value = '';
        }
    }

    // ------ handle file upload (txt, docx, pdf) ------
    function handleUpload(file) {
        const reader = new FileReader();
        const fileType = file.type;
        const fileName = file.name;
        const extension = fileName.split('.').pop().toUpperCase();

        // common file object skeleton
        let fileObj = {
            id: generateId(),
            name: fileName,
            type: fileType,
            extension: extension,
            comments: [],
            blobUrl: null,
            content: null
        };

        if (fileType === 'text/plain') {
            reader.onload = (e) => {
                fileObj.content = e.target.result;
                files.push(fileObj);
                renderFileList();
                selectFile(fileObj.id);  // auto view
            };
            reader.readAsText(file);
        }
        else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        fileObj.content = result.value; // HTML string
                        files.push(fileObj);
                        renderFileList();
                        selectFile(fileObj.id);
                    })
                    .catch(err => {
                        fileObj.content = '<p>⚠️ error parsing docx</p>';
                        files.push(fileObj);
                        renderFileList();
                        selectFile(fileObj.id);
                    });
            };
            reader.readAsArrayBuffer(file);
        }
        else if (fileType === 'application/pdf') {
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                fileObj.blobUrl = blobUrl;
                fileObj.content = null; // no textual content
                files.push(fileObj);
                renderFileList();
                selectFile(fileObj.id);
            };
            reader.readAsArrayBuffer(file);
        }
        else {
            alert('Only .pdf, .docx, .txt files are accepted');
        }
    }

    // ------ read mode toggle ------
    function toggleReadMode() {
        readModeActive = !readModeActive;
        if (readModeActive) {
            viewerContent.classList.add('read-mode');
            readModeToggle.classList.add('active');
            readModeToggle.innerHTML = '<i class="fas fa-eye-slash"></i> Normal mode';
        } else {
            viewerContent.classList.remove('read-mode');
            readModeToggle.classList.remove('active');
            readModeToggle.innerHTML = '<i class="fas fa-eye"></i> Read mode';
        }
    }

    // ------ event listeners ------
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const selectedFiles = Array.from(e.target.files);
        selectedFiles.forEach(f => handleUpload(f));
        fileInput.value = ''; // allow re-upload same file
    });

    addCommentBtn.addEventListener('click', addComment);

    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addComment();
        }
    });

    readModeToggle.addEventListener('click', toggleReadMode);

    // initial empty state
    renderFileList();
    renderViewer();
})();
