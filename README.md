# VRAQ - Visual Recognition and Quality Assurance System

## 🔬 Overview

VRAQ is an advanced PCB (Printed Circuit Board) defect detection system that combines cutting-edge computer vision with immersive VR visualization. It automatically identifies missing, misaligned, or defective components by comparing test PCBs against reference images, providing both traditional web-based analysis and revolutionary VR experiences for quality assurance teams.

### ✨ Key Features

- 🎯 **Automated Defect Detection** - AI-powered identification of missing, misaligned, and defective components
- 🖼️ **Side-by-Side Comparison** - Visual comparison with precise defect markers
- 🥽 **Immersive VR Experience** - 3D virtual reality PCB inspection environment
- 📊 **Detailed Analytics** - Comprehensive defect reporting and statistics
- 🔌 **RESTful API** - Integration with manufacturing systems
- 📱 **Cross-Platform** - Works on desktop, mobile, and VR devices

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Modern web browser (Chrome, Firefox, Edge)
- VR headset (optional, for VR experience)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vraq.git
   cd vraq
   ```

2. **Install dependencies**
   ```bash
   pip install flask flask-cors opencv-python numpy pillow werkzeug gunicorn
   ```

3. **Run the application**
   ```bash
   python main.py
   ```

4. **Access the system**
   - Web Interface: `http://localhost:5000`
   - VR Interface: `http://localhost:5000/vr`

---

## 📸 Upload Your PCB Images

### Supported Formats
- **PNG** (Recommended for best quality)
- **JPEG/JPG** (Good for general use)
- **TIFF** (Professional imaging)

### Image Requirements
- **Maximum file size**: 10MB per image
- **Recommended resolution**: 1920x1080 or higher
- **Quality**: High contrast, well-lit PCB images


---

## 🖥️ System Interfaces

### Web Interface
[VRAQ - Web Interface](https://vraq.onrender.com)

**Features:**
- Drag-and-drop file upload
- Side-by-side image comparison
- Interactive defect markers
- Detailed component analysis table
- Export results to JSON

### VR Interface
[VRAQ - VR Interface](ttps://vraq.onrender.com/VR)

**Features:**
- Immersive 3D PCB visualization
- Floating defect markers in 3D space
- Voice commands and hand tracking
- Teleportation controls
- In-VR file upload system

---

## 🔍 Detection Capabilities

### Defect Types Detected

| Defect Type | Description | Visual Indicator |
|-------------|-------------|------------------|
| 🔴 **Missing** | Component absent from expected location | Red X marker |
| 🟠 **Misaligned** | Component positioned incorrectly | Orange arrow showing direction |
| 🟢 **OK** | Component present and correctly positioned | Green checkmark |

---

## 🎯 Use Cases

### Manufacturing Quality Control
- **Production Line Integration**: Automated inspection at scale
- **Batch Processing**: Analyze multiple PCBs simultaneously
- **Trend Analysis**: Track defect patterns over time

### Training & Education
- **VR Training**: Immersive defect identification training
- **Remote Assistance**: Expert guidance via VR collaboration
- **Documentation**: Visual defect catalogs for training materials

### Research & Development
- **Process Optimization**: Identify improvement opportunities
- **Failure Analysis**: Root cause investigation
- **Prototype Validation**: Early-stage design verification

---

## 🔬 Technology Stack

### Backend
- **Flask** - Web framework
- **OpenCV** - Computer vision
- **NumPy** - Numerical computing
- **Pillow** - Image processing

### Frontend
- **Bootstrap** - UI framework
- **JavaScript** - Interactive features
- **A-Frame** - VR framework
- **Three.js** - 3D graphics

### Detection Algorithm
- **Template Matching** - Component identification
- **Correlation Analysis** - Defect classification
- **Geometric Validation** - Position verification

---



## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

