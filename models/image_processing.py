import cv2
import numpy as np
from PIL import Image
import io
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Image processing utilities for PCB analysis"""
    
    def __init__(self):
        self.max_dimension = 1920  # Maximum image dimension for processing
    
    def load_image(self, image_path: str) -> Optional[np.ndarray]:
        """
        Load image from file path
        
        Args:
            image_path: Path to image file
            
        Returns:
            Loaded image as numpy array or None if failed
        """
        try:
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"Failed to load image: {image_path}")
                return None
            
            # Preprocess the image
            processed_image = self.preprocess_image(image)
            return processed_image
            
        except Exception as e:
            logger.error(f"Error loading image {image_path}: {str(e)}")
            return None
    
    def load_image_from_bytes(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """
        Load image from bytes (for API uploads)
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Loaded image as numpy array or None if failed
        """
        try:
            # Convert bytes to PIL Image
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert PIL to OpenCV format
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            # Preprocess the image
            processed_image = self.preprocess_image(opencv_image)
            return processed_image
            
        except Exception as e:
            logger.error(f"Error loading image from bytes: {str(e)}")
            return None
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for PCB analysis
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        # Resize if image is too large
        resized_image = self.resize_image(image)
        
        # Apply noise reduction
        denoised_image = self.reduce_noise(resized_image)
        
        # Normalize image
        normalized_image = self.normalize_image(denoised_image)
        
        return normalized_image
    
    def resize_image(self, image: np.ndarray) -> np.ndarray:
        """
        Resize image if it's too large while maintaining aspect ratio
        
        Args:
            image: Input image
            
        Returns:
            Resized image
        """
        height, width = image.shape[:2]
        
        # Check if resizing is needed
        if max(height, width) <= self.max_dimension:
            return image
        
        # Calculate scaling factor
        if height > width:
            scale = self.max_dimension / height
        else:
            scale = self.max_dimension / width
        
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        logger.debug(f"Resized image from {width}x{height} to {new_width}x{new_height}")
        
        return resized
    
    def reduce_noise(self, image: np.ndarray) -> np.ndarray:
        """
        Apply noise reduction using Gaussian blur
        
        Args:
            image: Input image
            
        Returns:
            Denoised image
        """
        # Apply slight Gaussian blur to reduce noise
        kernel_size = 3
        denoised = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        return denoised
    
    def normalize_image(self, image: np.ndarray) -> np.ndarray:
        """
        Normalize image values to improve consistency
        
        Args:
            image: Input image
            
        Returns:
            Normalized image
        """
        # Convert to float32 for processing
        normalized = image.astype(np.float32)
        
        # Normalize to 0-255 range
        cv2.normalize(normalized, normalized, 0, 255, cv2.NORM_MINMAX)
        
        # Convert back to uint8
        normalized = normalized.astype(np.uint8)
        
        return normalized
    
    def apply_adaptive_threshold(self, image: np.ndarray) -> np.ndarray:
        """
        Apply adaptive thresholding to create binary image
        
        Args:
            image: Input grayscale image
            
        Returns:
            Binary thresholded image
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Apply adaptive threshold
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        return binary
    
    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance image contrast using CLAHE
        
        Args:
            image: Input image
            
        Returns:
            Contrast enhanced image
        """
        if len(image.shape) == 3:
            # Convert to LAB color space
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            # Merge channels and convert back to BGR
            enhanced = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        else:
            # Apply CLAHE to grayscale image
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(image)
        
        return enhanced
    
    def crop_region(self, image: np.ndarray, x: int, y: int, width: int, height: int) -> np.ndarray:
        """
        Crop specific region from image
        
        Args:
            image: Input image
            x, y: Top-left corner coordinates
            width, height: Region dimensions
            
        Returns:
            Cropped image region
        """
        return image[y:y+height, x:x+width]
