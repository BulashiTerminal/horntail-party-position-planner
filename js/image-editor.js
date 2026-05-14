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
        this.imageList = document.getElementById('imageList');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.toast = document.getElementById('toast');

        // State management
        this.draggableImages = new Map();
        this.selectedImage = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDrawing = false;

        // Default SVG-based images (no external dependencies)
        this.defaultImages = [
            { name: 'Mountain', svg: this.createMountainSVG() },
            { name: 'Forest', svg: this.createForestSVG() },
            { name: 'Ocean', svg: this.createOceanSVG() },
            { name: 'Desert', svg: this.createDesertSVG() },
            { name: 'Sunset', svg: this.createSunsetSVG() },
            { name: 'Snow', svg: this.createSnowSVG() }
        ];

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupCanvas();
        this.loadDefaultImages();
        this.attachEventListeners();
        this.showToast('Welcome to Image Editor! Drag images onto the canvas.', 'info');
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
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    /**
     * Draw gradient background with decorative elements
     */
    drawBackground() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Main gradient
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Decorative circles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * w,
                Math.random() * h,
                Math.random() * 150 + 50,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    /**
     * Load default images to library
     */
    loadDefaultImages() {
        this.defaultImages.forEach(image => {
            this.addImageToLibrary(image.name, image.svg, true);
        });
    }

    /**
     * Add image item to sidebar library
     */
    addImageToLibrary(name, imageData, isSVG = false) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.draggable = true;

        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        if (isSVG) {
            // Insert SVG directly
            container.innerHTML = imageData;
        } else {
            // Load image
            const img = document.createElement('img');
            img.src = imageData;
            img.alt = name;
            container.appendChild(img);
        }

        const label = document.createElement('div');
        label.className = 'image-item-label';
        label.textContent = name;

        imageItem.appendChild(container);
        imageItem.appendChild(label);

        imageItem.addEventListener('dragstart', (e) => this.handleDragStart(e, imageData, name, isSVG));

        this.imageList.appendChild(imageItem);
    }

    /**
     * Handle drag start from library
     */
    handleDragStart(e, imageData, imageName, isSVG) {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('imageData', imageData);
        e.dataTransfer.setData('imageName', imageName);
        e.dataTransfer.setData('isSVG', isSVG);
        
        // Set drag image
        const dragImage = document.createElement('div');
        dragImage.style.width = '50px';
        dragImage.style.height = '50px';
        if (isSVG) {
            dragImage.innerHTML = imageData;
        } else {
            const img = document.createElement('img');
            img.src = imageData;
            img.style.width = '100%';
            dragImage.appendChild(img);
        }
        document.body.appendChild(dragImage);
        dragImage.style.position = 'absolute';
        dragImage.style.pointerEvents = 'none';
        dragImage.style.top = '-1000px';
        
        e.dataTransfer.setDragImage(dragImage, 25, 25);
        
        setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Canvas drop
        this.canvasOverlay.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvasOverlay.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleCanvasDrop(e);
        });

        // Upload
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

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
     * Handle drop on canvas
     */
    handleCanvasDrop(e) {
        const imageData = e.dataTransfer.getData('imageData');
        const imageName = e.dataTransfer.getData('imageName');
        const isSVG = e.dataTransfer.getData('isSVG') === 'true';

        if (imageData) {
            const rect = this.canvasOverlay.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.addImageToCanvas(imageData, imageName, x, y, isSVG);
        }
    }

    /**
     * Add image to canvas
     */
    addImageToCanvas(imageData, imageName, x, y, isSVG) {
        const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const imageContainer = document.createElement('div');
        imageContainer.id = imageId;
        imageContainer.className = 'draggable-image';
        imageContainer.style.left = `${Math.max(0, x - 50)}px`;
        imageContainer.style.top = `${Math.max(0, y - 50)}px`;
        imageContainer.style.width = '100px';
        imageContainer.style.height = '100px';

        // Add image/SVG
        if (isSVG) {
            imageContainer.innerHTML = imageData;
        } else {
            const img = document.createElement('img');
            img.src = imageData;
            img.alt = imageName;
            imageContainer.appendChild(img);
        }

        // Create controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'image-controls';

        const increaseBtn = this.createControlButton('+', 'increase', () => {
            this.resizeImage(imageId, 1.2);
        });

        const decreaseBtn = this.createControlButton('-', 'decrease', () => {
            this.resizeImage(imageId, 0.8);
        });

        const deleteBtn = this.createControlButton('✕', 'delete', () => {
            this.deleteImage(imageId);
        });

        controlsDiv.appendChild(increaseBtn);
        controlsDiv.appendChild(decreaseBtn);
        controlsDiv.appendChild(deleteBtn);

        imageContainer.appendChild(controlsDiv);
        this.canvasOverlay.appendChild(imageContainer);

        // Store image data
        this.draggableImages.set(imageId, {
            element: imageContainer,
            data: imageData,
            name: imageName,
            width: 100,
            height: 100,
            x: parseInt(imageContainer.style.left),
            y: parseInt(imageContainer.style.top),
            isSVG: isSVG
        });

        // Attach drag listeners
        this.attachImageDragListeners(imageId);

        // Select new image
        this.selectImage(imageId);
        this.showToast(`Added ${imageName} to canvas`, 'success');
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
            this.selectImage(imageId);
            this.startDragImage(e, imageId);
        };

        const handleClick = (e) => {
            e.stopPropagation();
            this.selectImage(imageId);
        };

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);
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
        const rect = data.element.getBoundingClientRect();
        const overlayRect = this.canvasOverlay.getBoundingClientRect();

        const startX = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const startY = (e.clientY || e.touches?.[0].clientY) - rect.top;

        this.dragOffset = { x: startX, y: startY };

        const handleMove = (moveEvent) => {
            const clientX = moveEvent.clientX || moveEvent.touches?.[0].clientX;
            const clientY = moveEvent.clientY || moveEvent.touches?.[0].clientY;

            if (!clientX || !clientY) return;

            const x = clientX - overlayRect.left - this.dragOffset.x;
            const y = clientY - overlayRect.top - this.dragOffset.y;

            const boundedX = Math.max(0, Math.min(x, overlayRect.width - data.width));
            const boundedY = Math.max(0, Math.min(y, overlayRect.height - data.height));

            data.element.style.left = `${boundedX}px`;
            data.element.style.top = `${boundedY}px`;
            data.x = boundedX;
            data.y = boundedY;
            data.element.classList.add('dragging');
        };

        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
            
            if (data) {
                data.element.classList.remove('dragging');
            }
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    }

    /**
     * Resize image
     */
    resizeImage(imageId, factor) {
        const data = this.draggableImages.get(imageId);
        if (!data) return;

        const newWidth = Math.max(50, Math.min(400, data.width * factor));
        const newHeight = Math.max(50, Math.min(400, data.height * factor));

        data.element.style.width = `${newWidth}px`;
        data.element.style.height = `${newHeight}px`;
        data.width = newWidth;
        data.height = newHeight;
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
            this.showToast(`Removed ${data.name}`, 'info');
        }
    }

    /**
     * Clear all images
     */
    clearCanvas() {
        if (this.draggableImages.size === 0) {
            this.showToast('Canvas is already empty', 'info');
            return;
        }

        if (confirm('Clear all images from canvas?')) {
            this.draggableImages.forEach((data) => {
                data.element.remove();
            });
            this.draggableImages.clear();
            this.selectedImage = null;
            this.showToast('Canvas cleared', 'success');
        }
    }

    /**
     * Handle file upload
     */
    handleFileUpload(e) {
        const files = Array.from(e.target.files);
        let uploaded = 0;

        files.forEach(file => {
            if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
                const reader = new FileReader();

                reader.onload = (event) => {
                    const imageName = file.name.split('.')[0];
                    this.addImageToLibrary(imageName, event.target.result, false);
                    uploaded++;
                };

                reader.onerror = () => {
                    this.showToast(`Error loading ${file.name}`, 'error');
                };

                reader.readAsDataURL(file);
            } else if (file.size >= 5 * 1024 * 1024) {
                this.showToast(`${file.name} is too large (max 5MB)`, 'error');
            }
        });

        if (uploaded > 0) {
            this.showToast(`Uploaded ${uploaded} image(s)`, 'success');
        }

        this.fileInput.value = '';
    }

    /**
     * Download composition
     */
    downloadComposition() {
        if (this.draggableImages.size === 0) {
            this.showToast('Add images before downloading', 'info');
            return;
        }

        const link = document.createElement('a');
        link.download = `composition-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        this.showToast('Composition downloaded!', 'success');
    }

    /**
     * Copy composition data as JSON
     */
    copyCompositionData() {
        const data = {
            timestamp: new Date().toISOString(),
            images: Array.from(this.draggableImages.entries()).map(([id, img]) => ({
                id: id,
                name: img.name,
                x: img.x,
                y: img.y,
                width: img.width,
                height: img.height
            }))
        };

        const jsonString = JSON.stringify(data, null, 2);
        
        navigator.clipboard.writeText(jsonString).then(() => {
            this.showToast('Composition data copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy (use manual copy)', 'error');
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        if (!this.selectedImage) return;

        switch(e.key) {
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.deleteImage(this.selectedImage);
                break;
            case '+':
            case '=':
                e.preventDefault();
                this.resizeImage(this.selectedImage, 1.1);
                break;
            case '-':
            case '_':
                e.preventDefault();
                this.resizeImage(this.selectedImage, 0.9);
                break;
            case 'Escape':
                this.deselectImage();
                break;
        }
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

    /**
     * SVG Image Generators (no external images needed)
     */

    createMountainSVG() {
        return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#8B7355;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#654321;stop-opacity:1" />
                </linearGradient>
            </defs>
            <polygon points="100,40 160,140 40,140" fill="url(#mountainGrad)"/>
            <polygon points="60,140 100,90 140,140" fill="#A0826D"/>
        </svg>`;
    }

    createForestSVG() {
        return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#87CEEB"/>
            <polygon points="50,80 70,50 90,80" fill="#228B22"/>
            <polygon points="110,90 135,55 160,90" fill="#2E8B57"/>
            <polygon points="140,110 160,80 180,110" fill="#32CD32"/>
            <rect x="45" y="80" width="10" height="30" fill="#8B4513"/>
            <rect x="130" y="90" width="12" height="40" fill="#8B4513"/>
        </svg>`;
    }

    createOceanSVG() {
        return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1E90FF;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#oceanGrad)"/>
            <path d="M 0 80 Q 50 70 100 80 T 200 80" stroke="#4169E1" stroke-width="3" fill="none"/>
            <path d="M 0 120 Q 50 110 100 120 T 200 120" stroke="#1E90FF" stroke-width="2" fill="none"/>
            <circle cx="160" cy="40" r="15" fill="#FFD700" opacity="0.8"/>
        </svg>`;
    }

    createDesertSVG() {
        return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="desertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FFE4B5;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#DEB887;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#desertGrad)"/>
            <ellipse cx="50" cy="160" rx="40" ry="20" fill="#D2B48C"/>
            <ellipse cx="150" cy="140" rx="50" ry="25" fill="#D2B48C"/>
            <circle cx="180" cy="30" r="20" fill="#FFD700"/>
            <polygon points="80,100 90,80 100,100" fill="#228B22"/>
        </svg>`;
    }

    createSunsetSVG() {
        return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF6347;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#4B0082;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#sunsetGrad)"/>
            <circle cx="100" cy="100" r="35" fill="#FF8C00" opacity="0.9"/>
            <polygon points="20,180 100,120 180,180" fill="#000080" opacity="0.6"/>
        </svg>`;
    }

    createSnowSVG() {
        return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#E0FFFF"/>
            <circle cx="100" cy="80" r="30" fill="#FFFFFF" stroke="#E0F6FF" stroke-width="2"/>
            <circle cx="70" cy="120" r="20" fill="#F0F8FF"/>
            <circle cx="130" cy="130" r="25" fill="#F0F8FF"/>
            <circle cx="100" cy="160" r="15" fill="#E0FFFF" stroke="#87CEEB" stroke-width="1"/>
            <circle cx="50" cy="50" r="8" fill="#FFFFFF" opacity="0.7"/>
            <circle cx="160" cy="70" r="6" fill="#FFFFFF" opacity="0.7"/>
        </svg>`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageEditor();
});
