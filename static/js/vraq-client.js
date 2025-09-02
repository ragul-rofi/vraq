/**
 * VRAQ Client - Interface for communicating with Flask backend
 */
class VRAQClient {
    constructor(apiUrl = '/api') {
        this.apiUrl = apiUrl;
        this.analysisCache = new Map();
    }

    /**
     * Analyze PCB images and return results
     * @param {File} referenceImage - Reference PCB image
     * @param {File} testImage - Test PCB image
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeImages(referenceImage, testImage) {
        const formData = new FormData();
        formData.append('reference_image', referenceImage);
        formData.append('test_image', testImage);

        try {
            // Show progress
            this.updateProgress(10, 'Uploading images...');

            const response = await fetch(`${this.apiUrl}/analyze`, {
                method: 'POST',
                body: formData
            });

            this.updateProgress(50, 'Processing images...');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const results = await response.json();
            
            this.updateProgress(90, 'Formatting results...');

            // Cache the results
            this.analysisCache.set(results.analysis_id, results);
            
            // Store globally for export
            window.lastAnalysisResults = results;

            this.updateProgress(100, 'Complete!');

            // Convert to VR format
            return this.formatDefectsForVR(results);

        } catch (error) {
            console.error('Analysis failed:', error);
            this.updateProgress(0, 'Error occurred');
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    /**
     * Get analysis results by ID
     * @param {string} analysisId - Analysis ID
     * @returns {Promise<Object>} Analysis results
     */
    async getAnalysisResults(analysisId) {
        // Check cache first
        if (this.analysisCache.has(analysisId)) {
            return this.analysisCache.get(analysisId);
        }

        try {
            const response = await fetch(`${this.apiUrl}/analysis/${analysisId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const results = await response.json();
            this.analysisCache.set(analysisId, results);
            return results;
        } catch (error) {
            console.error('Failed to get analysis results:', error);
            throw error;
        }
    }

    /**
     * Get list of available templates
     * @returns {Promise<Array>} List of templates
     */
    async getTemplateList() {
        try {
            const response = await fetch(`${this.apiUrl}/templates`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to get template list:', error);
            throw error;
        }
    }

    /**
     * Upload template images
     * @param {FileList} templateFiles - Template image files
     * @returns {Promise<Object>} Upload results
     */
    async uploadTemplates(templateFiles) {
        const formData = new FormData();
        
        Array.from(templateFiles).forEach((file, index) => {
            formData.append('template_files', file);
        });

        try {
            const response = await fetch(`${this.apiUrl}/upload_template`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Template upload failed:', error);
            throw error;
        }
    }

    /**
     * Check backend health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    /**
     * Format backend results for VR visualization
     * @param {Object} apiResponse - Backend API response
     * @returns {Object} VR-formatted results
     */
    formatDefectsForVR(apiResponse) {
        if (!apiResponse || !apiResponse.components) {
            return {
                analysis_id: 'unknown',
                components: [],
                vr_markers: [],
                statistics: { ok: 0, missing: 0, misaligned: 0 }
            };
        }

        const vrMarkers = [];
        const statistics = { ok: 0, missing: 0, misaligned: 0 };

        apiResponse.components.forEach((component, index) => {
            // Count statistics
            if (component.status === 'OK') statistics.ok++;
            else if (component.status === 'MISSING') statistics.missing++;
            else if (component.status === 'MISALIGNED') statistics.misaligned++;

            // Convert to VR coordinates
            const vrPosition = this.imageToVRCoordinates(
                component.expected_location,
                apiResponse.image_dimensions || { width: 1920, height: 1080 }
            );

            vrMarkers.push({
                id: `marker_${index}`,
                component: component.name,
                type: component.component_type || 'component',
                status: component.status,
                confidence: component.confidence,
                position: vrPosition,
                detectedPosition: component.detected_location ? 
                    this.imageToVRCoordinates(component.detected_location, apiResponse.image_dimensions) : null,
                deviation: component.deviation_pixels,
                color: this.getStatusColor(component.status),
                animation: this.getStatusAnimation(component.status)
            });
        });

        return {
            analysis_id: apiResponse.analysis_id,
            timestamp: apiResponse.timestamp,
            overall_status: apiResponse.overall_status,
            components: apiResponse.components,
            vr_markers: vrMarkers,
            statistics: statistics,
            image_dimensions: apiResponse.image_dimensions,
            vr_data: apiResponse.vr_data || {}
        };
    }

    /**
     * Convert image coordinates to VR world coordinates
     * @param {Array} imageCoords - [x, y] in image space
     * @param {Object} imageDimensions - {width, height} of image
     * @returns {Object} VR position {x, y, z}
     */
    imageToVRCoordinates(imageCoords, imageDimensions = { width: 1920, height: 1080 }) {
        if (!imageCoords || imageCoords.length < 2) {
            return { x: 0, y: 0.1, z: 0 };
        }

        // Normalize coordinates (0-1)
        const normalizedX = imageCoords[0] / imageDimensions.width;
        const normalizedY = imageCoords[1] / imageDimensions.height;

        // Map to PCB board dimensions (4 units wide, 2.5 units deep)
        const pcbWidth = 4;
        const pcbDepth = 2.5;
        const pcbHeight = 0.15; // Above the PCB surface

        return {
            x: (normalizedX - 0.5) * pcbWidth,
            y: pcbHeight,
            z: (0.5 - normalizedY) * pcbDepth // Invert Y for VR space
        };
    }

    /**
     * Get color for defect status
     * @param {string} status - Component status
     * @returns {string} Hex color
     */
    getStatusColor(status) {
        const colors = {
            'OK': '#4caf50',
            'MISSING': '#f44336',
            'MISALIGNED': '#ffc107',
            'ERROR': '#9c27b0'
        };
        return colors[status] || '#666666';
    }

    /**
     * Get animation type for defect status
     * @param {string} status - Component status
     * @returns {string} Animation type
     */
    getStatusAnimation(status) {
        const animations = {
            'OK': 'gentle-glow',
            'MISSING': 'pulse',
            'MISALIGNED': 'bounce',
            'ERROR': 'flash'
        };
        return animations[status] || 'none';
    }

    /**
     * Update progress indicator
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateProgress(percent, message) {
        const progressBar = document.getElementById('progress-bar');
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');

        if (progressBar && progressFill && progressText) {
            progressFill.style.width = `${percent}%`;
            progressText.textContent = message;

            if (percent >= 100) {
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 1000);
            }
        }

        // Emit custom event
        document.dispatchEvent(new CustomEvent('vraq-progress', {
            detail: { percent, message }
        }));
    }

    /**
     * Get analysis statistics
     * @param {Object} results - Analysis results
     * @returns {Object} Statistics summary
     */
    getStatistics(results) {
        if (!results || !results.components) {
            return { total: 0, ok: 0, missing: 0, misaligned: 0 };
        }

        const stats = results.components.reduce((acc, component) => {
            acc.total++;
            if (component.status === 'OK') acc.ok++;
            else if (component.status === 'MISSING') acc.missing++;
            else if (component.status === 'MISALIGNED') acc.misaligned++;
            return acc;
        }, { total: 0, ok: 0, missing: 0, misaligned: 0 });

        return stats;
    }

    /**
     * Validate image file
     * @param {File} file - Image file
     * @returns {Object} Validation result
     */
    validateImageFile(file) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Invalid file type. Please use PNG, JPG, JPEG, or TIFF.'
            };
        }

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size too large. Maximum size is 10MB.'
            };
        }

        return { valid: true };
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Export results to various formats
     * @param {Object} results - Analysis results
     * @param {string} format - Export format ('json', 'csv')
     * @returns {void}
     */
    exportResults(results, format = 'json') {
        if (!results) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `vraq_analysis_${timestamp}`;

        switch (format) {
            case 'json':
                this.downloadJSON(results, `${filename}.json`);
                break;
            case 'csv':
                this.downloadCSV(results, `${filename}.csv`);
                break;
            default:
                console.error('Unsupported export format:', format);
        }
    }

    /**
     * Download data as JSON file
     * @param {Object} data - Data to download
     * @param {string} filename - File name
     */
    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        this.downloadBlob(dataBlob, filename);
    }

    /**
     * Download results as CSV file
     * @param {Object} results - Analysis results
     * @param {string} filename - File name
     */
    downloadCSV(results, filename) {
        if (!results.components) return;

        const headers = ['Component', 'Type', 'Status', 'Confidence', 'Expected X', 'Expected Y', 'Detected X', 'Detected Y', 'Deviation'];
        const rows = results.components.map(component => [
            component.name,
            component.component_type || 'unknown',
            component.status,
            component.confidence.toFixed(3),
            component.expected_location[0],
            component.expected_location[1],
            component.detected_location ? component.detected_location[0] : 'N/A',
            component.detected_location ? component.detected_location[1] : 'N/A',
            component.deviation_pixels ? component.deviation_pixels.toFixed(1) : 'N/A'
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(csvBlob, filename);
    }

    /**
     * Download blob as file
     * @param {Blob} blob - Data blob
     * @param {string} filename - File name
     */
    downloadBlob(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VRAQClient;
}