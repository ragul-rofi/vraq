# VRAQ - Visual Recognition and Quality Assurance System

## Overview

VRAQ is a PCB (Printed Circuit Board) defect detection system that uses computer vision and template matching to identify defects in electronic components. The system analyzes PCB images by comparing test images against reference images to detect missing, misaligned, or defective components. Built with Flask as the web framework and OpenCV for image processing, it provides a web interface for uploading images and viewing detailed analysis results.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Web Framework
The application uses Flask as the primary web framework with a traditional MVC architecture. Flask was chosen for its simplicity and rapid development capabilities, making it ideal for prototyping and small to medium-scale applications. The application follows a modular structure with separate packages for models, configuration, and templates.

### VR Interface
Added an immersive VR web application using A-Frame and Three.js that visualizes PCB defect detection results in 3D virtual reality. The VR interface includes:
- Interactive 3D PCB model with component visualization
- Real-time defect markers with color-coded status indicators
- Voice commands and hand tracking support
- Teleportation controls for navigation
- File upload interface within VR environment
- Live statistics and component details display

### Image Processing Pipeline
The core image processing is handled by OpenCV through two main components:
- **ImageProcessor**: Handles image loading, preprocessing, normalization, and format conversion
- **DefectDetector**: Performs template matching using correlation coefficients to identify component locations and defects

The system uses grayscale conversion and adaptive thresholding for better template matching accuracy. Images are automatically resized to maintain consistent processing performance while preserving quality.

### Template Matching Algorithm
The defect detection relies on OpenCV's `TM_CCOEFF_NORMED` template matching method with configurable confidence thresholds (default 0.8). This approach compares reference component templates against test images to identify:
- Missing components
- Misaligned components  
- Components that don't match expected patterns

### File Handling
The system implements secure file upload handling with:
- File extension validation (PNG, JPG, JPEG, TIFF)
- Size limits (10MB maximum)
- Secure filename processing using Werkzeug utilities
- Temporary storage in designated upload directories

### Configuration Management
A centralized configuration system uses environment variables with sensible defaults for:
- Detection sensitivity thresholds
- File size limits
- Directory paths
- Performance parameters

### Frontend Architecture
The frontend uses Bootstrap for responsive design with a dark theme optimized for technical applications. JavaScript handles:
- Image preview functionality
- Form validation
- Progress indication
- File size validation

### Analysis Results
Results are structured as JSON responses containing:
- Component-by-component analysis
- Defect classifications and locations
- Overall status indicators
- Analysis metadata and timestamps

## External Dependencies

### Core Libraries
- **Flask**: Web framework for request handling and routing
- **OpenCV (cv2)**: Computer vision library for image processing and template matching
- **NumPy**: Numerical computing for array operations and image data manipulation
- **Werkzeug**: WSGI utilities for secure file handling and middleware
- **Pillow (PIL)**: Python Imaging Library for additional image format support

### Frontend Dependencies
- **Bootstrap**: CSS framework for responsive UI components
- **Font Awesome**: Icon library for user interface elements
- **Custom CSS/JS**: Application-specific styling and interactive features

### Development Tools
- **Python Logging**: Built-in logging for debugging and monitoring
- **Path/OS modules**: File system operations and path management

### Image Formats
The system supports standard image formats commonly used in PCB documentation:
- PNG (recommended for technical images)
- JPEG/JPG (compressed formats)
- TIFF (high-quality technical imaging)

### No Database Dependencies
The current architecture is stateless and file-based, storing templates and uploads in the filesystem without requiring a database backend. This simplifies deployment but limits historical analysis capabilities.