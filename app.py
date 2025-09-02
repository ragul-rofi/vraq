import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
import cv2
import numpy as np
from datetime import datetime
import uuid
import json
from pathlib import Path

# Import our custom modules
from models.detection import DefectDetector
from models.image_processing import ImageProcessor
from config.settings import Config

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "vraq-dev-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Enable CORS for VR frontend
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Load configuration
config = Config()
app.config.update(config.get_config())

# Initialize processors
image_processor = ImageProcessor()
defect_detector = DefectDetector(config)

# Ensure upload directories exist
os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(config.TEMPLATE_DIR, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Main page for PCB defect detection"""
    return render_template('index.html')

@app.route('/vr')
def vr_interface():
    """VR interface for immersive PCB defect visualization"""
    try:
        with open('vr_index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return "VR interface not found", 404

@app.route('/assets/<path:filename>')
def vr_assets(filename):
    """Serve VR assets from the assets folder"""
    try:
        return send_from_directory('assets', filename)
    except FileNotFoundError:
        return "Asset not found", 404

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files for image comparison"""
    try:
        return send_from_directory('uploads', filename)
    except FileNotFoundError:
        return "File not found", 404

@app.route('/analyze', methods=['POST'])
def analyze_pcb():
    """Analyze PCB for defects"""
    try:
        # Check if files were uploaded
        if 'reference_image' not in request.files or 'test_image' not in request.files:
            flash('Both reference and test images are required', 'error')
            return redirect(url_for('index'))
        
        reference_file = request.files['reference_image']
        test_file = request.files['test_image']
        
        # Validate files
        if reference_file.filename == '' or test_file.filename == '':
            flash('Please select both images', 'error')
            return redirect(url_for('index'))
        
        if not (allowed_file(reference_file.filename) and allowed_file(test_file.filename)):
            flash('Invalid file format. Please use PNG, JPG, JPEG, or TIFF', 'error')
            return redirect(url_for('index'))
        
        # Save uploaded files
        analysis_id = str(uuid.uuid4())
        reference_filename = secure_filename(f"{analysis_id}_ref_{reference_file.filename}")
        test_filename = secure_filename(f"{analysis_id}_test_{test_file.filename}")
        
        reference_path = os.path.join(config.UPLOAD_DIR, reference_filename)
        test_path = os.path.join(config.UPLOAD_DIR, test_filename)
        
        reference_file.save(reference_path)
        test_file.save(test_path)
        
        # Process images
        logger.info(f"Processing analysis {analysis_id}")
        
        # Load and preprocess images
        reference_img = image_processor.load_image(reference_path)
        test_img = image_processor.load_image(test_path)
        
        if reference_img is None or test_img is None:
            flash('Error loading images. Please check file format', 'error')
            return redirect(url_for('index'))
        
        # Perform defect detection
        results = defect_detector.analyze_pcb(reference_img, test_img, analysis_id)
        
        # Add image URLs for side-by-side comparison
        results['reference_image_url'] = url_for('uploaded_file', filename=reference_filename)
        results['test_image_url'] = url_for('uploaded_file', filename=test_filename)
        
        return render_template('results.html', results=results)
        
    except Exception as e:
        logger.error(f"Error in PCB analysis: {str(e)}")
        flash(f'Error processing images: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/templates')
def template_management():
    """Template management page"""
    templates = []
    template_dir = Path(config.TEMPLATE_DIR)
    
    if template_dir.exists():
        for template_file in template_dir.glob('*'):
            if template_file.is_file() and allowed_file(template_file.name):
                templates.append({
                    'name': template_file.name,
                    'size': template_file.stat().st_size,
                    'modified': datetime.fromtimestamp(template_file.stat().st_mtime)
                })
    
    return render_template('template_management.html', templates=templates)

@app.route('/upload_template', methods=['POST'])
def upload_template():
    """Upload template images"""
    try:
        if 'template_files' not in request.files:
            flash('No files selected', 'error')
            return redirect(url_for('template_management'))
        
        files = request.files.getlist('template_files')
        uploaded_count = 0
        
        for file in files:
            if file.filename and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(config.TEMPLATE_DIR, filename)
                file.save(file_path)
                uploaded_count += 1
        
        if uploaded_count > 0:
            flash(f'Successfully uploaded {uploaded_count} template(s)', 'success')
        else:
            flash('No valid files were uploaded', 'error')
            
    except Exception as e:
        logger.error(f"Error uploading templates: {str(e)}")
        flash(f'Error uploading templates: {str(e)}', 'error')
    
    return redirect(url_for('template_management'))

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """API endpoint for PCB analysis"""
    try:
        # This is a JSON API endpoint for programmatic access
        if 'reference_image' not in request.files or 'test_image' not in request.files:
            return jsonify({'error': 'Both reference and test images are required'}), 400
        
        reference_file = request.files['reference_image']
        test_file = request.files['test_image']
        
        if not (allowed_file(reference_file.filename) and allowed_file(test_file.filename)):
            return jsonify({'error': 'Invalid file format'}), 400
        
        # Process images in memory for API
        reference_img = image_processor.load_image_from_bytes(reference_file.read())
        test_img = image_processor.load_image_from_bytes(test_file.read())
        
        if reference_img is None or test_img is None:
            return jsonify({'error': 'Error loading images'}), 400
        
        analysis_id = str(uuid.uuid4())
        results = defect_detector.analyze_pcb(reference_img, test_img, analysis_id)
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/templates', methods=['GET'])
def api_get_templates():
    """API endpoint to get list of templates"""
    try:
        templates = []
        template_dir = Path(config.TEMPLATE_DIR)
        
        if template_dir.exists():
            for template_file in template_dir.glob('*'):
                if template_file.is_file() and allowed_file(template_file.name):
                    templates.append({
                        'name': template_file.name,
                        'size': template_file.stat().st_size,
                        'modified': datetime.fromtimestamp(template_file.stat().st_mtime).isoformat()
                    })
        
        return jsonify({
            'templates': templates,
            'count': len(templates)
        })
        
    except Exception as e:
        logger.error(f"API Error getting templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload_template', methods=['POST'])
def api_upload_template():
    """API endpoint for template upload"""
    try:
        if 'template_files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('template_files')
        uploaded_files = []
        
        for file in files:
            if file.filename and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(config.TEMPLATE_DIR, filename)
                file.save(file_path)
                uploaded_files.append(filename)
        
        return jsonify({
            'uploaded_files': uploaded_files,
            'count': len(uploaded_files),
            'message': f'Successfully uploaded {len(uploaded_files)} template(s)'
        })
        
    except Exception as e:
        logger.error(f"API Error uploading templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
