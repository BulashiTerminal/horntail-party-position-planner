/**
 * DRAGGABLE IMAGE EDITOR
 * A GitHub Pages-compatible interactive image composition tool
 * Pure JavaScript - No dependencies required
 */

class ImageEditor {
    constructor() {
        // Canvas & DOM elements
        this.canvas = document.getElementById('canvas');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        this.sceneList = document.getElementById('sceneList');
        this.skillList = document.getElementById('skillList');
        this.clearBtn = document.getElementById('clearBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.toast = document.getElementById('toast');

        // State management
        this.draggableImages = new Map();
        this.selectedImage = null;
        this.dragOffset = { x: 0, y: 0 };
        this.currentScene = null;
        this.currentSceneImage = null;

        this.scenePath = './imgs/scenes/';
        this.skillPath = './imgs/skills/';

        this.sceneFiles = [
            'right.png',
            'horntail.png',
            "Map_Horntail's_Cave.png"
        ];

        this.skillFiles = [
            'sk_03074.png',
            'sk_04004.png',
            'sk_04009.png',
            'sk_04015.png',
            'sk_04022.png',
            'sk_04023.png',
            'sk_04025.png',
            'sk_04026.png',
            'sk_04027.png',
            'sk_04029.png',
            'sk_04030.png',
            'sk_04033.png',
            'sk_04035.png',
            'sk_04039.png',
            'sk_04040.png',
            'sk_04043.png',
            'sk_04044.png',
            'sk_04045.png',
            'sk_04053.png',
            'sk_04054.png',
            'sk_04055.png',
            'sk_04058.png',
            'sk_04065.png',
            'sk_04070.png'
        ];

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupCanvas();
        this.loadScenes();
        this.loadSkills();
        this.attachEventListeners();
        this.showToast('Select a scene, then click skills to place them.', 'info');
    }

    /**
     * Setup canvas and background
     */
    setupCanvas() {
        const wrapper = this.canvas.parentElement;
        const resizeCanvas = () => {
            this.canvas.width = wrapper.clientWidth;
            this.canvas.height = wrapper.clientHeight;
            this.drawBackground();
            this.keepAllSkillsWithinCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    /**
     * Draw current scene background
     */
    drawBackground() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!this.currentSceneImage) {
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, 0, w, h);
            return;
        }

        const image = this.currentSceneImage;
        const drawX = Math.floor((w - image.naturalWidth) / 2);
        const drawY = Math.floor((h - image.naturalHeight) / 2);

        ctx.drawImage(image, drawX, drawY);
    }

    /**
     * Load scene thumbnails
     */
    loadScenes() {
        this.sceneFiles.forEach((fileName, index) => {
            const imageUrl = `${this.scenePath}${fileName}`;
            this.addSceneToLibrary(fileName, imageUrl);

            if (index === 0) {
                this.setScene(imageUrl, fileName);
            }
        });
    }

    /**
     * Load skill thumbnails
     */
    loadSkills() {
        this.skillFiles.forEach(fileName => {
            const imageUrl = `${this.skillPath}${fileName}`;
            this.addSkillToLibrary(fileName, imageUrl);
        });
    }

    /**
     * Add scene item to sidebar
     */
    addSceneToLibrary(name, imageUrl) {
        const sceneItem = document.createElement('button');
        sceneItem.type = 'button';
        sceneItem.className = 'image-item scene-item';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = name;

        sceneItem.appendChild(img);

        sceneItem.addEventListener('click', () => {
            this.setScene(imageUrl, name);
        });

        this.sceneList.appendChild(sceneItem);
    }

    /**
     * Add skill item to sidebar
     */
    addSkillToLibrary(name, imageUrl) {
        const skillItem = document.createElement('button');
        skillItem.type = 'button';
        skillItem.className = 'image-item skill-item';
        skillItem.draggable = true;

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = name;
        img.draggable = false;

        skillItem.appendChild(img);

        skillItem.addEventListener('dragstart', (e) => {
            this.handleSkillDragStart(e, imageUrl, name);
        });

        this.skillList.appendChild(skillItem);
    }

    /**
     * Handle skill drag start from sidebar
     */
    handleSkillDragStart(e, imageUrl, imageName) {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('skillUrl', imageUrl);
        e.dataTransfer.setData('skillName', imageName);

        const dragImage = document.createElement('img');
        dragImage.src = imageUrl;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        dragImage.style.pointerEvents = 'none';

        document.body.appendChild(dragImage);

        e.dataTransfer.setDragImage(dragImage, 16, 16);

        setTimeout(() => {
            dragImage.remove();
        }, 0);
    }

    /**
     * Change current scene background without removing placed skills
     */
    setScene(imageUrl, sceneName) {
        const image = new Image();

        image.onload = () => {
            this.currentScene = {
                name: sceneName,
                url: imageUrl
            };
            this.currentSceneImage = image;
            this.drawBackground();

            document.querySelectorAll('.scene-item').forEach(item => {
                item.classList.toggle(
                    'active',
                    item.querySelector('img')?.getAttribute('src') === imageUrl
                );
            });

            this.showToast(`Scene changed to ${this.formatImageName(sceneName)}`, 'success');
        };

        image.onerror = () => {
            this.showToast(`Could not load scene: ${sceneName}`, 'error');
        };

        image.src = imageUrl;
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        this.canvasOverlay.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvasOverlay.addEventListener('drop', (e) => {
            e.preventDefault();

            const imageUrl = e.dataTransfer.getData('skillUrl');
            const imageName = e.dataTransfer.getData('skillName');

            if (!imageUrl) return;

            const rect = this.canvasOverlay.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.addImageToCanvas(imageUrl, imageName, x, y);
        });

        // Controls
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.downloadBtn.addEventListener('click', () => this.downloadComposition());
        this.copyBtn.addEventListener('click', () => this.copyCompositionData());

        // Canvas click to deselect
        this.canvasOverlay.addEventListener('click', (e) => {
            if (e.target === this.canvasOverlay) {
                this.deselectImage();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Add skill image to canvas
     */
    addImageToCanvas(imageData, imageName, x, y) {
        const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const overlayRect = this.canvasOverlay.getBoundingClientRect();

        const imageContainer = document.createElement('div');
        imageContainer.id = imageId;
        imageContainer.className = 'draggable-image';

        const width = 64;
        const height = 64;
        const startX = typeof x === 'number' ? x - width / 2 : overlayRect.width / 2 - width / 2;
        const startY = typeof y === 'number' ? y - height / 2 : overlayRect.height / 2 - height / 2;

        const boundedX = Math.max(0, Math.min(startX, overlayRect.width - width));
        const boundedY = Math.max(0, Math.min(startY, overlayRect.height - height));

        imageContainer.style.left = `${boundedX}px`;
        imageContainer.style.top = `${boundedY}px`;
        imageContainer.style.width = `${width}px`;
        imageContainer.style.height = `${height}px`;

        const img = document.createElement('img');
        img.src = imageData;
        img.alt = imageName;
        imageContainer.appendChild(img);

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'image-controls';

        const deleteBtn = this.createControlButton('✕', 'delete', () => {
            this.deleteImage(imageId);
        });

        controlsDiv.appendChild(deleteBtn);

        imageContainer.appendChild(controlsDiv);
        this.canvasOverlay.appendChild(imageContainer);

        this.draggableImages.set(imageId, {
            element: imageContainer,
            data: imageData,
            name: imageName,
            width,
            height,
            x: boundedX,
            y: boundedY
        });

        this.attachImageDragListeners(imageId);
        this.selectImage(imageId);
        this.showToast(`Added ${this.formatImageName(imageName)}`, 'success');
    }

    /**
     * Create control button
     */
    createControlButton(text, className, onClick) {
        const btn = document.createElement('button');
        btn.className = `control-btn ${className}`;
        btn.textContent = text;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    }

    /**
     * Attach drag listeners to image
     */
    attachImageDragListeners(imageId) {
        const element = this.draggableImages.get(imageId).element;

        const startDrag = (e) => {
            if (e.target.closest('.image-controls')) return;
            e.preventDefault();
            this.selectImage(imageId);
            this.startDragImage(e, imageId);
        };

        const handleClick = (e) => {
            e.stopPropagation();
            this.selectImage(imageId);
        };

        element.addEventListener('pointerdown', startDrag);
        element.addEventListener('click', handleClick);
    }

    /**
     * Select image
     */
    selectImage(imageId) {
        this.deselectImage();
        this.selectedImage = imageId;
        const data = this.draggableImages.get(imageId);
        if (data) {
            data.element.classList.add('selected');
        }
    }

    /**
     * Deselect image
     */
    deselectImage() {
        if (this.selectedImage) {
            const data = this.draggableImages.get(this.selectedImage);
            if (data) {
                data.element.classList.remove('selected');
            }
        }
        this.selectedImage = null;
    }

    /**
     * Start dragging image
     */
    startDragImage(e, imageId) {
        const data = this.draggableImages.get(imageId);
        if (!data) return;

        const elementRect = data.element.getBoundingClientRect();
        const pointerX = e.clientX;
        const pointerY = e.clientY;

        this.dragOffset = {
            x: pointerX - elementRect.left,
            y: pointerY - elementRect.top
        };

        data.element.setPointerCapture?.(e.pointerId);
        data.element.classList.add('dragging');

        const handleMove = (moveEvent) => {
            moveEvent.preventDefault();

            const overlayRect = this.canvasOverlay.getBoundingClientRect();

            const x = moveEvent.clientX - overlayRect.left - this.dragOffset.x;
            const y = moveEvent.clientY - overlayRect.top - this.dragOffset.y;

            const boundedX = Math.max(0, Math.min(x, overlayRect.width - data.width));
            const boundedY = Math.max(0, Math.min(y, overlayRect.height - data.height));

            data.element.style.transform = `translate3d(${boundedX - data.x}px, ${boundedY - data.y}px, 0)`;

            data.pendingX = boundedX;
            data.pendingY = boundedY;
        };

        const handleEnd = (endEvent) => {
            document.removeEventListener('pointermove', handleMove);
            document.removeEventListener('pointerup', handleEnd);
            document.removeEventListener('pointercancel', handleEnd);

            if (typeof data.pendingX === 'number' && typeof data.pendingY === 'number') {
                data.x = data.pendingX;
                data.y = data.pendingY;
                data.element.style.left = `${data.x}px`;
                data.element.style.top = `${data.y}px`;
                data.element.style.transform = '';
                delete data.pendingX;
                delete data.pendingY;
            }

            data.element.releasePointerCapture?.(endEvent.pointerId);
            data.element.classList.remove('dragging');
        };

        document.addEventListener('pointermove', handleMove, { passive: false });
        document.addEventListener('pointerup', handleEnd);
        document.addEventListener('pointercancel', handleEnd);
    }

    /**
     * Delete image
     */
    deleteImage(imageId) {
        const data = this.draggableImages.get(imageId);
        if (data) {
            data.element.remove();
            this.draggableImages.delete(imageId);
            if (this.selectedImage === imageId) {
                this.selectedImage = null;
            }
            this.showToast(`Removed ${this.formatImageName(data.name)}`, 'info');
        }
    }

    /**
     * Clear all skill images
     */
    clearCanvas() {
        if (this.draggableImages.size === 0) {
            return;
        }

        this.draggableImages.forEach((data) => {
            data.element.remove();
        });
        this.draggableImages.clear();
        this.selectedImage = null;
        this.showToast('Skills cleared', 'success');
    }

    /**
     * Keep all placed skills within visible canvas area
     */
    keepAllSkillsWithinCanvas() {
        const overlayRect = this.canvasOverlay.getBoundingClientRect();

        this.draggableImages.forEach((data) => {
            data.x = Math.max(0, Math.min(data.x, overlayRect.width - data.width));
            data.y = Math.max(0, Math.min(data.y, overlayRect.height - data.height));

            data.element.style.left = `${data.x}px`;
            data.element.style.top = `${data.y}px`;
        });
    }

    /**
     * Download composition
     */
    async downloadComposition() {
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = this.canvas.width;
        outputCanvas.height = this.canvas.height;

        const ctx = outputCanvas.getContext('2d');
        ctx.drawImage(this.canvas, 0, 0);

        const overlayRect = this.canvasOverlay.getBoundingClientRect();
        const scaleX = outputCanvas.width / overlayRect.width;
        const scaleY = outputCanvas.height / overlayRect.height;

        const images = Array.from(this.draggableImages.values());

        for (const item of images) {
            await new Promise((resolve) => {
                const image = new Image();
                image.onload = () => {
                    ctx.drawImage(
                        image,
                        item.x * scaleX,
                        item.y * scaleY,
                        item.width * scaleX,
                        item.height * scaleY
                    );
                    resolve();
                };
                image.onerror = resolve;
                image.src = item.data;
            });
        }

        const link = document.createElement('a');
        link.download = `horntail-planner-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = outputCanvas.toDataURL('image/png');
        link.click();

        this.showToast('Planner image downloaded!', 'success');
    }

    /**
     * Copy composition data as JSON
     */
    copyCompositionData() {
        const data = {
            timestamp: new Date().toISOString(),
            scene: this.currentScene,
            skills: Array.from(this.draggableImages.entries()).map(([id, img]) => ({
                id,
                name: img.name,
                src: img.data,
                x: img.x,
                y: img.y,
                width: img.width,
                height: img.height
            }))
        };

        const jsonString = JSON.stringify(data, null, 2);

        navigator.clipboard.writeText(jsonString).then(() => {
            this.showToast('Planner data copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy planner data', 'error');
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        if (!this.selectedImage) return;

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.deleteImage(this.selectedImage);
                break;
            case 'Escape':
                this.deselectImage();
                break;
        }
    }

    formatImageName(fileName) {
        return fileName
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]/g, ' ');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageEditor();
});