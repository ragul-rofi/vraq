/**
 * Custom A-Frame component for 3D defect markers
 */
AFRAME.registerComponent('defect-marker', {
    schema: {
        defectType: { type: 'string', default: 'MISSING' },
        componentName: { type: 'string', default: '' },
        componentType: { type: 'string', default: 'component' },
        confidence: { type: 'number', default: 0.0 },
        position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
        detectedPosition: { type: 'vec3', default: null },
        deviation: { type: 'number', default: 0 },
        color: { type: 'string', default: '#ffffff' },
        animationType: { type: 'string', default: 'pulse' },
        scale: { type: 'number', default: 1.0 },
        visible: { type: 'boolean', default: true },
        interactive: { type: 'boolean', default: true }
    },

    init: function() {
        this.createMarker();
        this.setupInteractions();
        this.startAnimations();
        
        // Store reference for easy access
        this.el.defectMarker = this;
    },

    update: function() {
        this.updateMarkerAppearance();
        this.updateAnimations();
    },

    remove: function() {
        this.cleanup();
    },

    createMarker: function() {
        const data = this.data;
        const el = this.el;

        // Remove existing children
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }

        // Create main marker geometry based on defect type
        this.mainMarker = document.createElement('a-entity');
        
        switch (data.defectType) {
            case 'MISSING':
                this.createMissingMarker();
                break;
            case 'MISALIGNED':
                this.createMisalignedMarker();
                break;
            case 'OK':
                this.createOKMarker();
                break;
            default:
                this.createDefaultMarker();
        }

        // Add main marker to entity
        el.appendChild(this.mainMarker);

        // Create info label
        this.createInfoLabel();

        // Create connection line for misaligned components
        if (data.defectType === 'MISALIGNED' && data.detectedPosition) {
            this.createConnectionLine();
        }

        // Add interactive class if interactive
        if (data.interactive) {
            el.classList.add('clickable');
        }
    },

    createMissingMarker: function() {
        const data = this.data;
        
        // Main sphere
        this.mainMarker.setAttribute('geometry', {
            primitive: 'sphere',
            radius: 0.08 * data.scale
        });
        
        this.mainMarker.setAttribute('material', {
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.3,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });

        // Add warning symbol
        const warningSymbol = document.createElement('a-text');
        warningSymbol.setAttribute('value', '!');
        warningSymbol.setAttribute('align', 'center');
        warningSymbol.setAttribute('position', '0 0 0.1');
        warningSymbol.setAttribute('scale', '2 2 2');
        warningSymbol.setAttribute('color', '#ffffff');
        warningSymbol.setAttribute('font', 'roboto');
        
        this.mainMarker.appendChild(warningSymbol);
    },

    createMisalignedMarker: function() {
        const data = this.data;
        
        // Main cube for misaligned components
        this.mainMarker.setAttribute('geometry', {
            primitive: 'box',
            width: 0.12 * data.scale,
            height: 0.12 * data.scale,
            depth: 0.12 * data.scale
        });
        
        this.mainMarker.setAttribute('material', {
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.6
        });

        // Add arrow indicator
        const arrow = document.createElement('a-cone');
        arrow.setAttribute('geometry', {
            primitive: 'cone',
            radiusBottom: 0.03,
            radiusTop: 0,
            height: 0.08
        });
        arrow.setAttribute('material', {
            color: '#ffffff',
            emissive: '#ffffff',
            emissiveIntensity: 0.5
        });
        arrow.setAttribute('position', '0 0.1 0');
        arrow.setAttribute('rotation', '0 0 180');
        
        this.mainMarker.appendChild(arrow);
    },

    createOKMarker: function() {
        const data = this.data;
        
        // Subtle ring for OK components
        this.mainMarker.setAttribute('geometry', {
            primitive: 'ring',
            radiusInner: 0.04 * data.scale,
            radiusOuter: 0.06 * data.scale
        });
        
        this.mainMarker.setAttribute('material', {
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.6
        });

        // Add checkmark
        const checkmark = document.createElement('a-text');
        checkmark.setAttribute('value', '✓');
        checkmark.setAttribute('align', 'center');
        checkmark.setAttribute('position', '0 0 0.01');
        checkmark.setAttribute('scale', '1.5 1.5 1.5');
        checkmark.setAttribute('color', data.color);
        
        this.mainMarker.appendChild(checkmark);
    },

    createDefaultMarker: function() {
        const data = this.data;
        
        this.mainMarker.setAttribute('geometry', {
            primitive: 'sphere',
            radius: 0.06 * data.scale
        });
        
        this.mainMarker.setAttribute('material', {
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.7
        });
    },

    createInfoLabel: function() {
        const data = this.data;
        
        this.infoLabel = document.createElement('a-entity');
        
        // Background plane
        const background = document.createElement('a-plane');
        background.setAttribute('width', '1.5');
        background.setAttribute('height', '0.8');
        background.setAttribute('material', {
            color: '#1a1a2e',
            opacity: 0.9,
            transparent: true
        });
        background.setAttribute('position', '0 0.3 0');
        
        // Info text
        const infoText = document.createElement('a-text');
        const confidencePercent = Math.round(data.confidence * 100);
        const infoValue = `${data.componentName}\nType: ${data.componentType}\nStatus: ${data.defectType}\nConfidence: ${confidencePercent}%`;
        
        if (data.deviation > 0) {
            infoValue += `\nDeviation: ${data.deviation.toFixed(1)}px`;
        }
        
        infoText.setAttribute('value', infoValue);
        infoText.setAttribute('align', 'center');
        infoText.setAttribute('position', '0 0.3 0.01');
        infoText.setAttribute('scale', '0.8 0.8 0.8');
        infoText.setAttribute('color', '#ffffff');
        infoText.setAttribute('font', 'roboto');
        infoText.setAttribute('wrapCount', 25);
        
        this.infoLabel.appendChild(background);
        this.infoLabel.appendChild(infoText);
        
        // Initially hidden
        this.infoLabel.setAttribute('visible', false);
        this.infoLabel.setAttribute('scale', '0.1 0.1 0.1');
        
        this.el.appendChild(this.infoLabel);
    },

    createConnectionLine: function() {
        const data = this.data;
        
        if (!data.detectedPosition) return;
        
        // Calculate line from expected to detected position
        const expectedPos = data.position;
        const detectedPos = data.detectedPosition;
        
        const distance = Math.sqrt(
            Math.pow(detectedPos.x - expectedPos.x, 2) +
            Math.pow(detectedPos.y - expectedPos.y, 2) +
            Math.pow(detectedPos.z - expectedPos.z, 2)
        );
        
        // Create line geometry
        this.connectionLine = document.createElement('a-entity');
        this.connectionLine.setAttribute('geometry', {
            primitive: 'cylinder',
            radius: 0.005,
            height: distance
        });
        
        this.connectionLine.setAttribute('material', {
            color: '#ffc107',
            emissive: '#ffc107',
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        // Position and rotate line
        const midPoint = {
            x: (expectedPos.x + detectedPos.x) / 2,
            y: (expectedPos.y + detectedPos.y) / 2,
            z: (expectedPos.z + detectedPos.z) / 2
        };
        
        this.connectionLine.setAttribute('position', midPoint);
        
        // Calculate rotation to point from expected to detected
        const direction = new THREE.Vector3(
            detectedPos.x - expectedPos.x,
            detectedPos.y - expectedPos.y,
            detectedPos.z - expectedPos.z
        ).normalize();
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        const euler = new THREE.Euler();
        euler.setFromQuaternion(quaternion, 'XYZ');
        
        this.connectionLine.setAttribute('rotation', {
            x: THREE.Math.radToDeg(euler.x),
            y: THREE.Math.radToDeg(euler.y),
            z: THREE.Math.radToDeg(euler.z)
        });
        
        this.el.appendChild(this.connectionLine);
        
        // Add detected position marker
        this.detectedMarker = document.createElement('a-sphere');
        this.detectedMarker.setAttribute('radius', 0.04);
        this.detectedMarker.setAttribute('material', {
            color: '#ffffff',
            emissive: '#ffffff',
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        this.detectedMarker.setAttribute('position', detectedPos);
        
        this.el.appendChild(this.detectedMarker);
    },

    setupInteractions: function() {
        const el = this.el;
        const data = this.data;
        
        if (!data.interactive) return;
        
        // Mouse/cursor interactions
        el.addEventListener('mouseenter', this.onHover.bind(this));
        el.addEventListener('mouseleave', this.onHoverEnd.bind(this));
        el.addEventListener('click', this.onClick.bind(this));
        
        // VR controller interactions
        el.addEventListener('raycaster-intersected', this.onHover.bind(this));
        el.addEventListener('raycaster-intersected-cleared', this.onHoverEnd.bind(this));
    },

    onHover: function(evt) {
        // Scale up marker
        this.mainMarker.setAttribute('animation__hover', {
            property: 'scale',
            to: '1.3 1.3 1.3',
            dur: 200,
            easing: 'easeOutQuad'
        });
        
        // Show info label
        this.infoLabel.setAttribute('visible', true);
        this.infoLabel.setAttribute('animation__show', {
            property: 'scale',
            to: '1 1 1',
            dur: 300,
            easing: 'easeOutBack'
        });
        
        // Always face camera
        this.infoLabel.setAttribute('look-at', '[camera]');
        
        // Emit hover event
        this.el.emit('defect-hover', {
            component: this.data.componentName,
            type: this.data.defectType,
            confidence: this.data.confidence
        });
    },

    onHoverEnd: function(evt) {
        // Scale back to normal
        this.mainMarker.setAttribute('animation__hover', {
            property: 'scale',
            to: '1 1 1',
            dur: 200,
            easing: 'easeOutQuad'
        });
        
        // Hide info label
        this.infoLabel.setAttribute('animation__hide', {
            property: 'scale',
            to: '0.1 0.1 0.1',
            dur: 200,
            easing: 'easeInQuad'
        });
        
        setTimeout(() => {
            this.infoLabel.setAttribute('visible', false);
        }, 200);
        
        // Emit hover end event
        this.el.emit('defect-hover-end');
    },

    onClick: function(evt) {
        // Pulse effect
        this.mainMarker.setAttribute('animation__click', {
            property: 'scale',
            to: '1.5 1.5 1.5',
            dur: 150,
            dir: 'alternate',
            loop: 2,
            easing: 'easeInOutQuad'
        });
        
        // Update component info panel
        this.updateComponentInfoPanel();
        
        // Emit click event
        this.el.emit('defect-click', {
            component: this.data.componentName,
            type: this.data.defectType,
            confidence: this.data.confidence,
            position: this.data.position,
            detectedPosition: this.data.detectedPosition,
            deviation: this.data.deviation
        });
        
        // Haptic feedback for VR
        if (evt.detail && evt.detail.cursorEl && evt.detail.cursorEl.components['haptics']) {
            evt.detail.cursorEl.components['haptics'].pulse(0.5, 100);
        }
    },

    updateComponentInfoPanel: function() {
        const infoPanel = document.getElementById('selected-component-info');
        const detailsEl = document.getElementById('component-details');
        
        if (infoPanel && detailsEl) {
            const data = this.data;
            
            detailsEl.innerHTML = `
                <h5>${data.componentName}</h5>
                <div class="detail-row">
                    <span>Type:</span>
                    <span>${data.componentType}</span>
                </div>
                <div class="detail-row">
                    <span>Status:</span>
                    <span style="color: ${data.color}">${data.defectType}</span>
                </div>
                <div class="detail-row">
                    <span>Confidence:</span>
                    <span>${Math.round(data.confidence * 100)}%</span>
                </div>
                <div class="detail-row">
                    <span>Position:</span>
                    <span>[${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)}, ${data.position.z.toFixed(2)}]</span>
                </div>
                ${data.detectedPosition ? `
                <div class="detail-row">
                    <span>Detected:</span>
                    <span>[${data.detectedPosition.x.toFixed(2)}, ${data.detectedPosition.y.toFixed(2)}, ${data.detectedPosition.z.toFixed(2)}]</span>
                </div>` : ''}
                ${data.deviation > 0 ? `
                <div class="detail-row">
                    <span>Deviation:</span>
                    <span>${data.deviation.toFixed(1)}px</span>
                </div>` : ''}
            `;
            
            infoPanel.style.display = 'block';
            infoPanel.classList.add('scale-in');
        }
    },

    startAnimations: function() {
        const data = this.data;
        
        switch (data.animationType) {
            case 'pulse':
                this.startPulseAnimation();
                break;
            case 'bounce':
                this.startBounceAnimation();
                break;
            case 'gentle-glow':
                this.startGlowAnimation();
                break;
            case 'flash':
                this.startFlashAnimation();
                break;
        }
    },

    startPulseAnimation: function() {
        this.mainMarker.setAttribute('animation__pulse', {
            property: 'scale',
            to: '1.2 1.2 1.2',
            dur: 1000,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutQuad'
        });
    },

    startBounceAnimation: function() {
        this.mainMarker.setAttribute('animation__bounce', {
            property: 'position',
            to: `0 ${0.05} 0`,
            dur: 800,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutBounce'
        });
        
        this.mainMarker.setAttribute('animation__rotate', {
            property: 'rotation',
            to: '0 360 0',
            dur: 2000,
            loop: true,
            easing: 'linear'
        });
    },

    startGlowAnimation: function() {
        const material = this.mainMarker.getAttribute('material');
        
        this.mainMarker.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: material.emissiveIntensity * 2,
            dur: 2000,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    },

    startFlashAnimation: function() {
        this.mainMarker.setAttribute('animation__flash', {
            property: 'material.opacity',
            to: 0.3,
            dur: 300,
            dir: 'alternate',
            loop: true,
            easing: 'linear'
        });
    },

    updateMarkerAppearance: function() {
        if (!this.mainMarker) return;
        
        const data = this.data;
        
        // Update material color
        const material = this.mainMarker.getAttribute('material');
        material.color = data.color;
        material.emissive = data.color;
        this.mainMarker.setAttribute('material', material);
        
        // Update visibility
        this.el.setAttribute('visible', data.visible);
        
        // Update scale
        const currentScale = this.el.getAttribute('scale');
        this.el.setAttribute('scale', {
            x: currentScale.x * data.scale,
            y: currentScale.y * data.scale,
            z: currentScale.z * data.scale
        });
    },

    updateAnimations: function() {
        // Remove existing animations
        this.mainMarker.removeAttribute('animation__pulse');
        this.mainMarker.removeAttribute('animation__bounce');
        this.mainMarker.removeAttribute('animation__glow');
        this.mainMarker.removeAttribute('animation__flash');
        this.mainMarker.removeAttribute('animation__rotate');
        
        // Start new animations
        this.startAnimations();
    },

    cleanup: function() {
        // Remove event listeners and clean up resources
        if (this.infoLabel) {
            this.el.removeChild(this.infoLabel);
        }
        
        if (this.connectionLine) {
            this.el.removeChild(this.connectionLine);
        }
        
        if (this.detectedMarker) {
            this.el.removeChild(this.detectedMarker);
        }
    }
});