// VRAQ Application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize progress bars with animation
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Form validation enhancements
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // File size validation
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const files = e.target.files;
            
            for (let i = 0; i < files.length; i++) {
                if (files[i].size > maxSize) {
                    alert(`File "${files[i].name}" is too large. Maximum size is 10MB.`);
                    e.target.value = '';
                    return;
                }
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Copy to clipboard functionality
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('Copied to clipboard!', 'success');
        }, function(err) {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy to clipboard', 'error');
        });
    };

    // Show toast notifications
    window.showToast = function(message, type = 'info') {
        const toastContainer = getOrCreateToastContainer();
        const toastId = 'toast_' + Date.now();
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    };

    function getOrCreateToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1070';
            document.body.appendChild(container);
        }
        return container;
    }

    // Loading state management
    window.setLoadingState = function(element, loading = true) {
        if (loading) {
            element.disabled = true;
            const originalText = element.innerHTML;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
        } else {
            element.disabled = false;
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.innerHTML = originalText;
                element.removeAttribute('data-original-text');
            }
        }
    };

    // Format file sizes
    window.formatFileSize = function(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Validate image files
    window.validateImageFile = function(file) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Invalid file type. Please use PNG, JPG, JPEG, or TIFF.' };
        }
        
        if (file.size > maxSize) {
            return { valid: false, error: 'File size too large. Maximum size is 10MB.' };
        }
        
        return { valid: true };
    };

    // Enhanced image preview with error handling
    window.setupImagePreview = function(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        
        if (!input || !preview) return;
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                const validation = validateImageFile(file);
                if (!validation.valid) {
                    showToast(validation.error, 'error');
                    e.target.value = '';
                    preview.style.display = 'none';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    preview.classList.add('fade-in');
                };
                reader.onerror = function() {
                    showToast('Error reading file', 'error');
                    preview.style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
                preview.classList.remove('fade-in');
            }
        });
    };

    // Enhanced range slider setup
    window.setupRangeSlider = function(sliderId, valueId, formatter = null) {
        const slider = document.getElementById(sliderId);
        const valueSpan = document.getElementById(valueId);
        
        if (!slider || !valueSpan) return;
        
        slider.addEventListener('input', function() {
            const value = formatter ? formatter(this.value) : this.value;
            valueSpan.textContent = value;
        });
        
        // Initialize with current value
        const initialValue = formatter ? formatter(slider.value) : slider.value;
        valueSpan.textContent = initialValue;
    };

    // Add fade-in animation class
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    console.log('VRAQ Application initialized successfully');
});

// Utility functions available globally
window.VRAQUtils = {
    formatTimestamp: function(timestamp) {
        return new Date(timestamp).toLocaleString();
    },
    
    downloadJSON: function(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },
    
    formatConfidence: function(confidence) {
        return (confidence * 100).toFixed(1) + '%';
    },
    
    getStatusColor: function(status) {
        const colors = {
            'OK': 'success',
            'MISSING': 'danger',
            'MISALIGNED': 'warning',
            'ERROR': 'danger'
        };
        return colors[status] || 'secondary';
    },
    
    getStatusIcon: function(status) {
        const icons = {
            'OK': 'check-circle',
            'MISSING': 'times-circle',
            'MISALIGNED': 'crosshairs',
            'ERROR': 'exclamation-triangle'
        };
        return icons[status] || 'question-circle';
    }
};
