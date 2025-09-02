/**
 * VR UI Controls and Interactions
 * Handles VR-specific UI elements and interactions
 */

// VR Control Panel Component
AFRAME.registerComponent('vr-control-panel', {
    schema: {
        position: { type: 'vec3', default: { x: 3, y: 0, z: 0 } },
        width: { type: 'number', default: 2.5 },
        height: { type: 'number', default: 2 }
    },

    init: function() {
        // this.createControlPanel();
        this.setupInteractions();
    },

    // createControlPanel: function() {
    //     const data = this.data;
        
    //     // Main panel background
    //     this.panelBg = document.createElement('a-plane');
    //     this.panelBg.setAttribute('position', data.position);
    //     this.panelBg.setAttribute('width', data.width);
    //     this.panelBg.setAttribute('height', data.height);
    //     this.panelBg.setAttribute('material', {
    //         color: '#2e2e2e',
    //         opacity: 0.9,
    //         transparent: true
    //     });
        
    //     this.el.appendChild(this.panelBg);
        
    //     // Create control buttons
    //     this.createButtons();
    // },

    createButtons: function() {
        const buttons = [
            { id: 'reset-view', label: 'Reset View', color: '#118A7E', action: 'resetView' },
            { id: 'toggle-markers', label: 'Toggle Markers', color: '#ff9800', action: 'toggleMarkers' },
            { id: 'export-data', label: 'Export Data', color: '#666666', action: 'exportData' }
        ];
        
        buttons.forEach((btn, index) => {
            const buttonEl = document.createElement('a-box');
            buttonEl.setAttribute('id', btn.id);
            buttonEl.setAttribute('position', `0 ${0.5 - (index * 0.4)} 0.01`);
            buttonEl.setAttribute('width', '1.5');
            buttonEl.setAttribute('height', '0.3');
            buttonEl.setAttribute('depth', '0.02');
            buttonEl.setAttribute('material', { color: btn.color });
            buttonEl.setAttribute('class', 'clickable vr-button');
            buttonEl.setAttribute('data-action', btn.action);
            
            // Button text
            const textEl = document.createElement('a-text');
            textEl.setAttribute('value', btn.label);
            textEl.setAttribute('align', 'center');
            textEl.setAttribute('position', '0 0 0.02');
            textEl.setAttribute('color', '#ffffff');
            textEl.setAttribute('width', '8');
            
            buttonEl.appendChild(textEl);
            this.panelBg.appendChild(buttonEl);
        });
    },

    setupInteractions: function() {
        // Button interactions
        this.el.addEventListener('click', this.handleButtonClick.bind(this));
        
        // Button hover effects
        const buttons = this.el.querySelectorAll('.vr-button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', this.handleButtonHover.bind(this));
            button.addEventListener('mouseleave', this.handleButtonHoverEnd.bind(this));
        });
    },

    handleButtonClick: function(evt) {
        const button = evt.target;
        const action = button.getAttribute('data-action');
        
        if (action) {
            // Button press animation
            button.setAttribute('animation__press', {
                property: 'position',
                to: `${button.getAttribute('position').x} ${button.getAttribute('position').y} ${button.getAttribute('position').z - 0.01}`,
                dur: 100,
                dir: 'alternate',
                loop: 1
            });
            
            // Execute action
            this.executeAction(action, button);
        }
    },

    handleButtonHover: function(evt) {
        const button = evt.target;
        button.setAttribute('animation__hover', {
            property: 'scale',
            to: '1.05 1.05 1.05',
            dur: 150
        });
    },

    handleButtonHoverEnd: function(evt) {
        const button = evt.target;
        button.setAttribute('animation__hover', {
            property: 'scale',
            to: '1 1 1',
            dur: 150
        });
    },

    executeAction: function(action, button) {
        switch (action) {
            case 'resetView':
                this.resetCameraView();
                break;
            case 'toggleMarkers':
                this.toggleDefectMarkers(button);
                break;
            case 'exportData':
                this.exportAnalysisData();
                break;
        }
    },

    resetCameraView: function() {
        const rig = document.querySelector('#rig');
        const camera = document.querySelector('[camera]');
        
        if (rig) {
            rig.setAttribute('animation__reset', {
                property: 'position',
                to: '0 1.6 2',
                dur: 1000,
                easing: 'easeInOutQuad'
            });
        }
        
        if (camera) {
            camera.setAttribute('animation__reset-rotation', {
                property: 'rotation',
                to: '0 0 0',
                dur: 1000,
                easing: 'easeInOutQuad'
            });
        }
    },

    toggleDefectMarkers: function(button) {
        const pcbBoard = document.querySelector('#pcb-board');
        if (pcbBoard && pcbBoard.components['pcb-visualizer']) {
            pcbBoard.components['pcb-visualizer'].toggleMarkersVisibility();
        }
    },

    exportAnalysisData: function() {
        if (window.lastAnalysisResults) {
            window.vraqClient.exportResults(window.lastAnalysisResults, 'json');
        }
    }
});

// VR Hand Tracking Component
AFRAME.registerComponent('vr-hand-tracking', {
    init: function() {
        this.setupHandTracking();
    },

    setupHandTracking: function() {
        const el = this.el;
        
        // Hand tracking events
        el.addEventListener('hand-tracking-extras-ready', () => {
            console.log('Hand tracking ready');
        });
        
        // Gesture recognition
        el.addEventListener('pinchstarted', this.handlePinchStart.bind(this));
        el.addEventListener('pinchended', this.handlePinchEnd.bind(this));
        el.addEventListener('thumbup', this.handleThumbsUp.bind(this));
    },

    handlePinchStart: function(evt) {
        // Handle pinch gesture
        console.log('Pinch started');
    },

    handlePinchEnd: function(evt) {
        // Handle pinch release
        console.log('Pinch ended');
    },

    handleThumbsUp: function(evt) {
        // Handle thumbs up gesture
        console.log('Thumbs up detected');
        this.showPositiveFeedback();
    },

    showPositiveFeedback: function() {
        // Show positive feedback animation
        const feedbackEl = document.createElement('a-text');
        feedbackEl.setAttribute('value', '👍 Great!');
        feedbackEl.setAttribute('position', '0 2 -1');
        feedbackEl.setAttribute('align', 'center');
        feedbackEl.setAttribute('color', '#4caf50');
        feedbackEl.setAttribute('scale', '2 2 2');
        
        feedbackEl.setAttribute('animation__appear', {
            property: 'scale',
            from: '0 0 0',
            to: '2 2 2',
            dur: 300
        });
        
        feedbackEl.setAttribute('animation__fade', {
            property: 'material.opacity',
            from: 1,
            to: 0,
            dur: 2000,
            delay: 1000
        });
        
        this.el.sceneEl.appendChild(feedbackEl);
        
        setTimeout(() => {
            if (feedbackEl.parentNode) {
                feedbackEl.parentNode.removeChild(feedbackEl);
            }
        }, 3000);
    }
});

// Teleportation Component
AFRAME.registerComponent('teleport-controls', {
    init: function() {
        this.setupTeleportation();
    },

    setupTeleportation: function() {
        // Setup teleportation areas
        const teleportAreas = document.querySelectorAll('.teleport-area');
        teleportAreas.forEach(area => {
            area.addEventListener('click', this.handleTeleport.bind(this));
            area.addEventListener('mouseenter', this.highlightTeleportArea.bind(this));
            area.addEventListener('mouseleave', this.unhighlightTeleportArea.bind(this));
        });
    },

    handleTeleport: function(evt) {
        const teleportArea = evt.target;
        const targetPosition = teleportArea.getAttribute('position');
        const rig = document.querySelector('#rig');
        
        if (rig && targetPosition) {
            // Animate teleportation
            rig.setAttribute('animation__teleport', {
                property: 'position',
                to: `${targetPosition.x} 1.6 ${targetPosition.z}`,
                dur: 500,
                easing: 'easeInOutQuad'
            });
            
            // Teleport effect
            this.showTeleportEffect(targetPosition);
        }
    },

    highlightTeleportArea: function(evt) {
        const area = evt.target;
        const material = area.getAttribute('material');
        material.opacity = 0.8;
        area.setAttribute('material', material);
        
        area.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: 0.3,
            dur: 200
        });
    },

    unhighlightTeleportArea: function(evt) {
        const area = evt.target;
        const material = area.getAttribute('material');
        material.opacity = 0.6;
        area.setAttribute('material', material);
        
        area.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: 0,
            dur: 200
        });
    },

    showTeleportEffect: function(position) {
        // Create teleport particle effect
        const effect = document.createElement('a-sphere');
        effect.setAttribute('position', `${position.x} 0.1 ${position.z}`);
        effect.setAttribute('radius', '0.1');
        effect.setAttribute('material', {
            color: '#118A7E',
            emissive: '#118A7E',
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        
        effect.setAttribute('animation__expand', {
            property: 'radius',
            from: 0.1,
            to: 1,
            dur: 500
        });
        
        effect.setAttribute('animation__fade', {
            property: 'material.opacity',
            from: 0.8,
            to: 0,
            dur: 500
        });
        
        this.el.sceneEl.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 500);
    }
});

// Voice Commands Component
AFRAME.registerComponent('voice-commands', {
    init: function() {
        this.setupVoiceRecognition();
    },

    setupVoiceRecognition: function() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = this.handleVoiceCommand.bind(this);
            this.recognition.onerror = this.handleVoiceError.bind(this);
            
            // Start listening
            this.recognition.start();
            console.log('Voice commands enabled');
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    },

    handleVoiceCommand: function(evt) {
        const command = evt.results[evt.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('Voice command:', command);
        
        // Process commands
        if (command.includes('reset view') || command.includes('reset camera')) {
            this.executeCommand('resetView');
        } else if (command.includes('toggle markers') || command.includes('hide markers') || command.includes('show markers')) {
            this.executeCommand('toggleMarkers');
        } else if (command.includes('export') || command.includes('download')) {
            this.executeCommand('exportData');
        } else if (command.includes('zoom in')) {
            this.executeCommand('zoomIn');
        } else if (command.includes('zoom out')) {
            this.executeCommand('zoomOut');
        } else if (command.includes('analyze') || command.includes('start analysis')) {
            this.executeCommand('startAnalysis');
        }
    },

    handleVoiceError: function(evt) {
        console.error('Voice recognition error:', evt.error);
    },

    executeCommand: function(command) {
        const controlPanel = document.querySelector('[vr-control-panel]');
        
        switch (command) {
            case 'resetView':
                if (controlPanel && controlPanel.components['vr-control-panel']) {
                    controlPanel.components['vr-control-panel'].resetCameraView();
                }
                break;
            case 'toggleMarkers':
                const toggleBtn = document.getElementById('toggle-markers-btn');
                if (toggleBtn) {
                    toggleBtn.click();
                }
                break;
            case 'exportData':
                const exportBtn = document.getElementById('export-results-btn');
                if (exportBtn && !exportBtn.disabled) {
                    exportBtn.click();
                }
                break;
            case 'zoomIn':
                this.adjustCameraDistance(-0.5);
                break;
            case 'zoomOut':
                this.adjustCameraDistance(0.5);
                break;
            case 'startAnalysis':
                const analyzeBtn = document.getElementById('analyze-btn');
                if (analyzeBtn && !analyzeBtn.disabled) {
                    analyzeBtn.click();
                }
                break;
        }
        
        // Show voice feedback
        this.showVoiceFeedback(command);
    },

    adjustCameraDistance: function(delta) {
        const rig = document.querySelector('#rig');
        if (rig) {
            const currentPos = rig.getAttribute('position');
            const newZ = Math.max(0.5, Math.min(5, currentPos.z + delta));
            
            rig.setAttribute('animation__zoom', {
                property: 'position',
                to: `${currentPos.x} ${currentPos.y} ${newZ}`,
                dur: 300
            });
        }
    },

    showVoiceFeedback: function(command) {
        const feedback = document.createElement('a-text');
        feedback.setAttribute('value', `Command: ${command}`);
        feedback.setAttribute('position', '0 3 -2');
        feedback.setAttribute('align', 'center');
        feedback.setAttribute('color', '#118A7E');
        feedback.setAttribute('scale', '1.5 1.5 1.5');
        
        feedback.setAttribute('animation__appear', {
            property: 'material.opacity',
            from: 0,
            to: 1,
            dur: 200
        });
        
        feedback.setAttribute('animation__disappear', {
            property: 'material.opacity',
            from: 1,
            to: 0,
            dur: 500,
            delay: 1500
        });
        
        this.el.sceneEl.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }
});

// Initialize VR UI components when A-Frame is ready
document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    
    if (scene) {
        // Add control panel component to VR control panel
        const vrControlPanel = document.querySelector('#vr-control-panel');
        if (vrControlPanel) {
            vrControlPanel.setAttribute('vr-control-panel', '');
        }
        
        // Add hand tracking to camera rig
        const rig = document.querySelector('#rig');
        if (rig) {
            rig.setAttribute('vr-hand-tracking', '');
            rig.setAttribute('teleport-controls', '');
            rig.setAttribute('voice-commands', '');
        }
        
        console.log('VR UI components initialized');
    }
});