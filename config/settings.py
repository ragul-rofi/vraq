import os
from pathlib import Path

class Config:
    """Configuration settings for VRAQ backend"""
    
    def __init__(self):
        # Directory settings
        self.BASE_DIR = Path(__file__).parent.parent
        self.TEMPLATE_DIR = os.getenv('TEMPLATE_DIR', str(self.BASE_DIR / 'reference_templates'))
        self.UPLOAD_DIR = os.getenv('UPLOAD_DIR', str(self.BASE_DIR / 'uploads'))
        
        # Detection settings
        self.CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.8'))
        self.LOCATION_TOLERANCE = int(os.getenv('LOCATION_TOLERANCE', '10'))
        
        # File handling settings
        self.MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '10485760'))  # 10MB
        self.ALLOWED_EXTENSIONS = set(
            os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,tiff').split(',')
        )
        
        # Flask settings
        self.SECRET_KEY = os.getenv('SESSION_SECRET', 'vraq-dev-secret-key')
        self.DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
        
        # Performance settings
        self.MAX_CONCURRENT_REQUESTS = int(os.getenv('MAX_CONCURRENT_REQUESTS', '10'))
        self.REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '30'))
    
    def get_config(self):
        """Get Flask configuration dictionary"""
        return {
            'SECRET_KEY': self.SECRET_KEY,
            'DEBUG': self.DEBUG,
            'MAX_CONTENT_LENGTH': self.MAX_FILE_SIZE,
            'UPLOAD_FOLDER': self.UPLOAD_DIR,
            'TEMPLATE_FOLDER': self.TEMPLATE_DIR
        }
