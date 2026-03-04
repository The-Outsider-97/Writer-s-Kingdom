(() => {
    const folderNameInput = document.getElementById('folderName');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const folderList = document.getElementById('folderList');
    const uploadInput = document.getElementById('storyFileInput');
    const uploadList = document.getElementById('uploadList');
    const blockInput = document.getElementById('blockText');
    const addBlockBtn = document.getElementById('addBlockBtn');
    const blockCanvas = document.getElementById('blockCanvas');
    const STORAGE_KEY = 'wk_tools_state_v1';

    if (!createFolderBtn) return;

    let dragged = null;

    const state = {
        folders: [],
        uploads: [],
        blocks: []
    };

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) return;
        try {
            const parsed = JSON.parse(rawState);
            if (Array.isArray(parsed.folders)) state.folders = parsed.folders;
            if (Array.isArray(parsed.uploads)) state.uploads = parsed.uploads;
            if (Array.isArray(parsed.blocks)) state.blocks = parsed.blocks;
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function renderFolders() {
        folderList.innerHTML = '';
        state.folders.forEach((name) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>📁 ${name}</strong><div class="muted">0 files</div>`;
            folderList.appendChild(li);
        });
    }

    function renderUploads() {
        uploadList.innerHTML = '';
        state.uploads.forEach((name) => {
            const li = document.createElement('li');
            li.textContent = `📄 ${name}`;
            uploadList.appendChild(li);
        });
    }

    function syncBlocksStateFromDom() {
        state.blocks = [...blockCanvas.querySelectorAll('.text-block')].map((el) => el.textContent);
        saveState();
    }

    function buildBlock(text) {
        const block = document.createElement('article');
        block.className = 'text-block';
        block.draggable = true;
        block.textContent = text;

        block.addEventListener('dragstart', () => {
            dragged = block;
            block.classList.add('dragging');
            block.style.opacity = '0.6';
        });

        block.addEventListener('dragend', () => {
            block.style.opacity = '1';
            block.classList.remove('dragging');
            dragged = null;
            syncBlocksStateFromDom();
        });

        return block;
    }

    function renderBlocks() {
        blockCanvas.innerHTML = '';
        state.blocks.forEach((text) => {
            blockCanvas.appendChild(buildBlock(text));
        });
    }

    createFolderBtn.addEventListener('click', () => {
        const name = folderNameInput.value.trim();
        if (!name) return;
        state.folders.push(name);
        saveState();
        renderFolders();
        folderNameInput.value = '';
    });

    uploadInput.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach((file) => {
            state.uploads.push(file.name);
        });
        saveState();
        renderUploads();
        uploadInput.value = '';
    });

    addBlockBtn.addEventListener('click', () => {
        const text = blockInput.value.trim();
        if (!text) return;

        state.blocks.push(text);
        saveState();
        renderBlocks();
        blockInput.value = '';
    });

    blockCanvas.addEventListener('dragover', (event) => {
        event.preventDefault();
        const afterElement = [...blockCanvas.querySelectorAll('.text-block:not(.dragging)')]
            .find((el) => event.clientY <= el.getBoundingClientRect().top + el.offsetHeight / 2);
        if (!dragged) return;

        if (!afterElement) {
            blockCanvas.appendChild(dragged);
        } else {
            blockCanvas.insertBefore(dragged, afterElement);
        }
    });

    loadState();
    renderFolders();
    renderUploads();
    renderBlocks();
})();
