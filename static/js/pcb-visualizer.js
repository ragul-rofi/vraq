/**
 * PCB Visualizer A-Frame Component
 * Main component for managing PCB defect visualization in VR
 */
AFRAME.registerComponent('pcb-visualizer', {
    schema: {
        apiUrl: { type: 'string', default: '/api' },
        defects: { type: 'array', default: [] },
        autoRefresh: { type: 'boolean', default: false },
        refreshInterval: { type: 'number', default: 5000 },
        showGrid: { type: 'boolean', default: true },
        markerScale: { type: 'number', default: 1.0 },
        animationSpeed: { type: 'number', default: 1.0 }
    },

    init: function() {
        this.markers = new Map();
        this.componentAreas = [];
        this.refreshTimer = null;
        this.isInitialized = false;
        
        // Initialize PCB visualization
        this.initializePCB();
        
        // Listen for external defect updates
        this.el.addEventListener('defects-updated', this.handleDefectsUpdate.bind(this));
        
        // Listen for marker interactions
        this.el.addEventListener('defect-hover', this.handleMarkerHover.bind(this));
        this.el.addEventListener('defect-click', this.handleMarkerClick.bind(this));
        
        console.log('PCB Visualizer initialized');
    },

    update: function(oldData) {
        const data = this.data;
        
        // Update marker scale if changed
        if (oldData.markerScale !== data.markerScale) {
            this.updateMarkerScale(data.markerScale);
        }
        
        // Update animation speed if changed
        if (oldData.animationSpeed !== data.animationSpeed) {
            this.updateAnimationSpeed(data.animationSpeed);
        }
        
        // Update defects if changed
        if (oldData.defects !== data.defects && data.defects.length > 0) {
            this.loadDefectData(data.defects);
        }
        
        // Handle auto-refresh toggle
        if (oldData.autoRefresh !== data.autoRefresh) {
            if (data.autoRefresh) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        }
        
        // Update grid visibility
        if (oldData.showGrid !== data.showGrid) {
            this.toggleGrid(data.showGrid);
        }
    },

    remove: function() {
        this.cleanup();
    },

    initializePCB: function() {
        this.createPCBGrid();
        this.createComponentAreas();
        this.setupPCBInteractions();
        this.isInitialized = true;
        
        // Auto-start refresh if enabled
        if (this.data.autoRefresh) {
            this.startAutoRefresh();
        }
    },

    createPCBGrid: function() {
        const gridContainer = this.el.querySelector('#pcb-grid');
        if (!gridContainer) return;
        
        // Clear existing grid
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild);
        }
        
        const pcbWidth = 0.4;
        const pcbDepth = 0.25;
        const gridSpacing = 0.01;
        
        // Create grid lines
        for (let x = -pcbWidth/2; x <= pcbWidth/2; x += gridSpacing) {
            const line = document.createElement('a-box');
            line.setAttribute('width', 0.0005);
            line.setAttribute('height', 0.0001);
            line.setAttribute('depth', pcbDepth);
            line.setAttribute('position', `${x} 0 0`);
            line.setAttribute('material', {
                color: '#1b5e20',
                opacity: 0.3,
                transparent: true
            });
            gridContainer.appendChild(line);
        }
        
        for (let z = -pcbDepth/2; z <= pcbDepth/2; z += gridSpacing) {
            const line = document.createElement('a-box');
            line.setAttribute('width', pcbWidth);
            line.setAttribute('height', 0.001);
            line.setAttribute('depth', 0.005);
            line.setAttribute('position', `0 0 ${z}`);
            line.setAttribute('material', {
                color: '#1b5e20',
                opacity: 0.3,
                transparent: true
            });
            gridContainer.appendChild(line);
        }
        
        // Add corner markers
        const corners = [
            { x: -pcbWidth/2, z: -pcbDepth/2 },
            { x: pcbWidth/2, z: -pcbDepth/2 },
            { x: -pcbWidth/2, z: pcbDepth/2 },
            { x: pcbWidth/2, z: pcbDepth/2 }
        ];
        
        corners.forEach((corner, index) => {
            const marker = document.createElement('a-sphere');
            marker.setAttribute('radius', 0.02);
            marker.setAttribute('position', `${corner.x} 0.01 ${corner.z}`);
            marker.setAttribute('material', {
                color: '#4caf50',
                emissive: '#4caf50',
                emissiveIntensity: 0.3
            });
            gridContainer.appendChild(marker);
        });
    },

    createComponentAreas: function() {
        const areasContainer = this.el.querySelector('#component-areas');
        if (!areasContainer) return;
        
        // Clear existing areas
        while (areasContainer.firstChild) {
            areasContainer.removeChild(areasContainer.firstChild);
        }
        
        // Create sample component mounting areas
        const areas = [
            { x: -1.5, z: -1, width: 0.3, depth: 0.2, type: 'resistor' },
            { x: -1, z: -1, width: 0.3, depth: 0.2, type: 'resistor' },
            { x: -0.5, z: -1, width: 0.3, depth: 0.2, type: 'resistor' },
            { x: 0, z: -0.8, width: 0.4, depth: 0.4, type: 'capacitor' },
            { x: 0.8, z: -0.8, width: 0.4, depth: 0.4, type: 'capacitor' },
            { x: -1.2, z: 0.2, width: 0.8, depth: 0.8, type: 'ic' },
            { x: 0.2, z: 0.2, width: 0.8, depth: 0.6, type: 'ic' },
            { x: -1.5, z: 1, width: 0.2, depth: 0.3, type: 'resistor' },
            { x: -1, z: 1, width: 0.2, depth: 0.3, type: 'resistor' },
            { x: 0.5, z: 1, width: 0.3, depth: 0.3, type: 'capacitor' },
            { x: 1.2, z: 0.8, width: 0.5, depth: 0.4, type: 'connector' }
        ];
        
        areas.forEach((area, index) => {
            const areaEl = document.createElement('a-box');
            areaEl.setAttribute('width', area.width);
            areaEl.setAttribute('height', 0.02);
            areaEl.setAttribute('depth', area.depth);
            areaEl.setAttribute('position', `${area.x} 0.01 ${area.z}`);
            
            const color = this.getComponentTypeColor(area.type);
            areaEl.setAttribute('material', {
                color: color,
                opacity: 0.2,
                transparent: true,
                roughness: 0.8
            });
            
            areaEl.setAttribute('class', 'component-area');
            areaEl.setAttribute('data-component-type', area.type);
            areaEl.setAttribute('data-area-id', `area_${index}`);
            
            areasContainer.appendChild(areaEl);
            this.componentAreas.push({
                id: `area_${index}`,
                element: areaEl,
                type: area.type,
                position: { x: area.x, y: 0.01, z: area.z },
                dimensions: { width: area.width, height: 0.02, depth: area.depth }
            });
        });
    },

    getComponentTypeColor: function(type) {
        const colors = {
            'resistor': '#8d6e63',
            'capacitor': '#5d4037',
            'ic': '#37474f',
            'connector': '#455a64',
            'component': '#616161'
        };
        return colors[type] || colors['component'];
    },

    setupPCBInteractions: function() {
        const el = this.el;
        
        // PCB board interactions
        el.addEventListener('click', this.handlePCBClick.bind(this));
        
        // Component area interactions
        const areas = el.querySelectorAll('.component-area');
        areas.forEach(area => {
            area.addEventListener('mouseenter', this.handleAreaHover.bind(this));
            area.addEventListener('mouseleave', this.handleAreaHoverEnd.bind(this));
            area.addEventListener('click', this.handleAreaClick.bind(this));
        });
    },

    loadDefectData: function(defects) {
        if (!Array.isArray(defects)) {
            console.warn('Invalid defects data provided to PCB visualizer');
            return;
        }
        
        console.log(`Loading ${defects.length} defect markers`);
        
        // Clear existing markers
        this.clearMarkers();
        
        // Create new markers
        defects.forEach((defect, index) => {
            this.createDefectMarker(defect, index);
        });
        
        // Update statistics
        this.updateStatistics(defects);
        
        // Emit loaded event
        this.el.emit('defects-loaded', { count: defects.length });
    },

    createDefectMarker: function(defect, index) {
        const markersContainer = this.el.querySelector('#defect-markers');
        if (!markersContainer) return;
        
        const markerEl = document.createElement('a-entity');
        markerEl.setAttribute('id', `defect-marker-${index}`);
        
        // Set position
        const position = defect.position || { x: 0, y: 0.1, z: 0 };
        markerEl.setAttribute('position', position);
        
        // Configure defect marker component
        markerEl.setAttribute('defect-marker', {
            defectType: defect.status || defect.type || 'UNKNOWN',
            componentName: defect.component || defect.name || `Component ${index + 1}`,
            componentType: defect.componentType || defect.type || 'component',
            confidence: defect.confidence || 0.0,
            position: position,
            detectedPosition: defect.detectedPosition || null,
            deviation: defect.deviation || 0,
            color: defect.color || this.getDefectColor(defect.status || defect.type),
            animationType: this.getAnimationType(defect.status || defect.type),
            scale: this.data.markerScale,
            visible: true,
            interactive: true
        });
        
        // Add to container
        markersContainer.appendChild(markerEl);
        
        // Store reference
        this.markers.set(`marker-${index}`, {
            element: markerEl,
            data: defect,
            id: index
        });
        
        // Add entrance animation
        this.addEntranceAnimation(markerEl, index);
    },

    getDefectColor: function(status) {
        const colors = {
            'OK': '#4caf50',
            'MISSING': '#f44336',
            'MISALIGNED': '#ffc107',
            'ERROR': '#9c27b0'
        };
        return colors[status] || '#666666';
    },

    getAnimationType: function(status) {
        const animations = {
            'OK': 'gentle-glow',
            'MISSING': 'pulse',
            'MISALIGNED': 'bounce',
            'ERROR': 'flash'
        };
        return animations[status] || 'none';
    },

    addEntranceAnimation: function(markerEl, index) {
        // Delayed entrance animation
        setTimeout(() => {
            markerEl.setAttribute('animation__entrance', {
                property: 'scale',
                from: '0 0 0',
                to: `${this.data.markerScale} ${this.data.markerScale} ${this.data.markerScale}`,
                dur: 500,
                easing: 'easeOutBack'
            });
            
            markerEl.setAttribute('animation__float', {
                property: 'position',
                from: `${markerEl.getAttribute('position').x} -0.5 ${markerEl.getAttribute('position').z}`,
                to: markerEl.getAttribute('position'),
                dur: 800,
                easing: 'easeOutBounce'
            });
        }, index * 100); // Stagger animations
    },

    clearMarkers: function() {
        const markersContainer = this.el.querySelector('#defect-markers');
        if (!markersContainer) return;
        
        // Animate out existing markers
        const existingMarkers = markersContainer.querySelectorAll('[defect-marker]');
        existingMarkers.forEach((marker, index) => {
            marker.setAttribute('animation__exit', {
                property: 'scale',
                to: '0 0 0',
                dur: 300,
                delay: index * 50,
                easing: 'easeInBack'
            });
            
            setTimeout(() => {
                if (marker.parentNode) {
                    marker.parentNode.removeChild(marker);
                }
            }, 300 + (index * 50));
        });
        
        // Clear markers map
        this.markers.clear();
    },

    updateStatistics: function(defects) {
        const stats = {
            total: defects.length,
            ok: defects.filter(d => (d.status || d.type) === 'OK').length,
            missing: defects.filter(d => (d.status || d.type) === 'MISSING').length,
            misaligned: defects.filter(d => (d.status || d.type) === 'MISALIGNED').length
        };
        
        // Update VR info panel
        const vrInfoPanel = this.el.querySelector('#vr-info-panel');
        if (vrInfoPanel) {
            const infoText = `PCB Analysis Results\n\nTotal Components: ${stats.total}\nOK: ${stats.ok}\nMissing: ${stats.missing}\nMisaligned: ${stats.misaligned}\n\nOverall Status: ${stats.missing > 0 || stats.misaligned > 0 ? 'DEFECTS FOUND' : 'ALL OK'}`;
            
            vrInfoPanel.setAttribute('text', {
                value: infoText,
                color: '#ffffff',
                align: 'center',
                width: 6,
                wrapCount: 30
            });
        }
        
        // Emit statistics update event
        this.el.emit('statistics-updated', stats);
    },

    updateMarkerScale: function(scale) {
        this.markers.forEach(marker => {
            const markerComponent = marker.element.components['defect-marker'];
            if (markerComponent) {
                markerComponent.data.scale = scale;
                markerComponent.update();
            }
        });
    },

    updateAnimationSpeed: function(speed) {
        this.markers.forEach(marker => {
            const markerComponent = marker.element.components['defect-marker'];
            if (markerComponent) {
                markerComponent.data.animationSpeed = speed;
                markerComponent.update();
            }
        });
    },

    toggleMarkersVisibility: function() {
        const markersContainer = this.el.querySelector('#defect-markers');
        if (markersContainer) {
            const isVisible = markersContainer.getAttribute('visible');
            markersContainer.setAttribute('visible', !isVisible);
            
            // Update button state
            const toggleBtn = document.getElementById('toggle-button');
            if (toggleBtn) {
                const material = toggleBtn.getAttribute('material');
                material.color = isVisible ? '#666666' : '#ff9800';
                toggleBtn.setAttribute('material', material);
                
                const text = toggleBtn.getAttribute('text');
                text.value = isVisible ? 'Show Markers' : 'Hide Markers';
                toggleBtn.setAttribute('text', text);
            }
        }
    },

    toggleGrid: function(show) {
        const gridContainer = this.el.querySelector('#pcb-grid');
        if (gridContainer) {
            gridContainer.setAttribute('visible', show);
        }
    },

    startAutoRefresh: function() {
        this.stopAutoRefresh(); // Clear existing timer
        
        this.refreshTimer = setInterval(() => {
            this.refreshDefectData();
        }, this.data.refreshInterval);
        
        console.log('Auto-refresh started');
    },

    stopAutoRefresh: function() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('Auto-refresh stopped');
        }
    },

    refreshDefectData: function() {
        // This would typically fetch fresh data from the backend
        console.log('Refreshing defect data...');
        
        // For now, emit a refresh event that the main application can handle
        this.el.emit('refresh-requested');
    },

    // Event Handlers
    handleDefectsUpdate: function(evt) {
        const defects = evt.detail.defects;
        this.loadDefectData(defects);
    },

    handleMarkerHover: function(evt) {
        console.log('Marker hovered:', evt.detail);
        
        // Could update a global info display or highlight related components
        this.highlightRelatedComponents(evt.detail.component);
    },

    handleMarkerClick: function(evt) {
        console.log('Marker clicked:', evt.detail);
        
        // Focus camera on clicked marker
        this.focusOnMarker(evt.target);
        
        // Emit to update UI panels
        document.dispatchEvent(new CustomEvent('marker-selected', {
            detail: evt.detail
        }));
    },

    handlePCBClick: function(evt) {
        // Handle clicks on empty PCB areas
        const intersection = evt.detail.intersection;
        if (intersection) {
            console.log('PCB clicked at:', intersection.point);
            
            // Could add markers at clicked position or show context menu
            this.el.emit('pcb-clicked', {
                position: intersection.point,
                worldPosition: intersection.point
            });
        }
    },

    handleAreaHover: function(evt) {
        const area = evt.target;
        const material = area.getAttribute('material');
        material.opacity = 0.4;
        area.setAttribute('material', material);
    },

    handleAreaHoverEnd: function(evt) {
        const area = evt.target;
        const material = area.getAttribute('material');
        material.opacity = 0.2;
        area.setAttribute('material', material);
    },

    handleAreaClick: function(evt) {
        const area = evt.target;
        const areaType = area.getAttribute('data-component-type');
        const areaId = area.getAttribute('data-area-id');
        
        console.log('Component area clicked:', areaType, areaId);
        
        // Could show component area information or allow interaction
        this.el.emit('area-clicked', {
            areaId: areaId,
            componentType: areaType,
            position: area.getAttribute('position')
        });
    },

    highlightRelatedComponents: function(componentName) {
        // Highlight components of the same type or in the same area
        this.markers.forEach(marker => {
            const markerComponent = marker.element.components['defect-marker'];
            if (markerComponent && markerComponent.data.componentName.includes(componentName.split('_')[0])) {
                // Add subtle highlight
                marker.element.setAttribute('animation__highlight', {
                    property: 'scale',
                    to: '1.1 1.1 1.1',
                    dur: 200,
                    easing: 'easeOutQuad'
                });
                
                setTimeout(() => {
                    marker.element.setAttribute('animation__unhighlight', {
                        property: 'scale',
                        to: '1 1 1',
                        dur: 200,
                        easing: 'easeOutQuad'
                    });
                }, 1000);
            }
        });
    },

    focusOnMarker: function(markerEl) {
        const camera = document.querySelector('[camera]');
        const rig = document.querySelector('#rig');
        
        if (camera && rig && markerEl) {
            const markerPos = markerEl.getAttribute('position');
            const focusPosition = {
                x: markerPos.x,
                y: markerPos.y + 0.5,
                z: markerPos.z + 1
            };
            
            // Animate camera to focus position
            rig.setAttribute('animation__focus', {
                property: 'position',
                to: `${focusPosition.x} ${focusPosition.y} ${focusPosition.z}`,
                dur: 1000,
                easing: 'easeInOutQuad'
            });
            
            // Look at the marker
            camera.setAttribute('animation__look', {
                property: 'rotation',
                to: `0 ${Math.atan2(markerPos.x - focusPosition.x, markerPos.z - focusPosition.z) * 180 / Math.PI} 0`,
                dur: 1000,
                easing: 'easeInOutQuad'
            });
        }
    },

    cleanup: function() {
        this.stopAutoRefresh();
        this.clearMarkers();
        
        // Remove event listeners
        this.el.removeEventListener('defects-updated', this.handleDefectsUpdate);
        this.el.removeEventListener('defect-hover', this.handleMarkerHover);
        this.el.removeEventListener('defect-click', this.handleMarkerClick);
        
        console.log('PCB Visualizer cleaned up');
    }
});