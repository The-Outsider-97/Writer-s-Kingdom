(() => {
    const folderNameInput = document.getElementById('folderName');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const folderList = document.getElementById('folderList');
    const uploadInput = document.getElementById('storyFileInput');
    const uploadList = document.getElementById('uploadList');
    const blockInput = document.getElementById('blockText');
    const addBlockBtn = document.getElementById('addBlockBtn');
    const blockCanvas = document.getElementById('blockCanvas');

    if (!createFolderBtn) return;

    let dragged = null;

    createFolderBtn.addEventListener('click', () => {
        const name = folderNameInput.value.trim();
        if (!name) return;
        const li = document.createElement('li');
        li.innerHTML = `<strong>📁 ${name}</strong><div class="muted">0 files</div>`;
        folderList.appendChild(li);
        folderNameInput.value = '';
    });

    uploadInput.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach((file) => {
            const li = document.createElement('li');
            li.textContent = `📄 ${file.name}`;
            uploadList.appendChild(li);
        });
        uploadInput.value = '';
    });

    addBlockBtn.addEventListener('click', () => {
        const text = blockInput.value.trim();
        if (!text) return;
        const block = document.createElement('article');
        block.className = 'text-block';
        block.draggable = true;
        block.textContent = text;

        block.addEventListener('dragstart', () => {
            dragged = block;
            block.style.opacity = '0.6';
        });

        block.addEventListener('dragend', () => {
            block.style.opacity = '1';
            dragged = null;
        });

        blockCanvas.appendChild(block);
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
})();