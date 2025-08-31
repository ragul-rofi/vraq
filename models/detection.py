import cv2
import numpy as np
from datetime import datetime
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

class DefectDetector:
    """PCB defect detection using OpenCV template matching"""
    
    def __init__(self, config):
        self.config = config
        self.confidence_threshold = config.CONFIDENCE_THRESHOLD
        self.location_tolerance = config.LOCATION_TOLERANCE
        
    def analyze_pcb(self, reference_img: np.ndarray, test_img: np.ndarray, analysis_id: str) -> Dict[str, Any]:
        """
        Analyze PCB for defects by comparing test image with reference image
        
        Args:
            reference_img: Reference PCB image
            test_img: Test PCB image to analyze
            analysis_id: Unique identifier for this analysis
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            logger.info(f"Starting PCB analysis {analysis_id}")
            
            # Convert images to grayscale for processing
            ref_gray = cv2.cvtColor(reference_img, cv2.COLOR_BGR2GRAY)
            test_gray = cv2.cvtColor(test_img, cv2.COLOR_BGR2GRAY)
            
            # Detect components in reference image
            components = self._detect_components(ref_gray)
            
            # Analyze each component
            component_results = []
            defect_markers = []
            overall_status = "OK"
            
            for component in components:
                result = self._analyze_component(component, ref_gray, test_gray)
                component_results.append(result)
                
                if result['status'] != 'OK':
                    overall_status = "DEFECTS_FOUND"
                    # Add VR marker for defects
                    defect_markers.append({
                        'position': self._calculate_vr_position(result['expected_location']),
                        'type': result['status'],
                        'component': result['name']
                    })
            
            # Build final result
            analysis_result = {
                'analysis_id': analysis_id,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'overall_status': overall_status,
                'components': component_results,
                'vr_data': {
                    'defect_markers': defect_markers
                },
                'image_dimensions': {
                    'width': test_img.shape[1],
                    'height': test_img.shape[0]
                }
            }
            
            logger.info(f"Analysis {analysis_id} completed. Status: {overall_status}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error in PCB analysis {analysis_id}: {str(e)}")
            return {
                'analysis_id': analysis_id,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'overall_status': 'ERROR',
                'error': str(e),
                'components': [],
                'vr_data': {'defect_markers': []}
            }
    
    def _detect_components(self, reference_img: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect components in reference image using contour detection
        
        Args:
            reference_img: Grayscale reference image
            
        Returns:
            List of detected components with their properties
        """
        components = []
        
        # Apply threshold to create binary image
        _, binary = cv2.threshold(reference_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        component_id = 1
        for contour in contours:
            # Filter out very small contours (noise)
            area = cv2.contourArea(contour)
            if area < 100:  # Minimum component area
                continue
                
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Extract component template
            template = reference_img[y:y+h, x:x+w]
            
            # Calculate center point
            center_x = x + w // 2
            center_y = y + h // 2
            
            # Classify component type based on shape characteristics
            component_type = self._classify_component_type(contour, area, w, h)
            
            component = {
                'name': f"{component_type}_{component_id:02d}",
                'type': component_type,
                'template': template,
                'expected_location': [center_x, center_y],
                'bounding_box': [x, y, w, h],
                'area': area
            }
            
            components.append(component)
            component_id += 1
        
        logger.info(f"Detected {len(components)} components in reference image")
        return components
    
    def _classify_component_type(self, contour: np.ndarray, area: float, width: int, height: int) -> str:
        """
        Classify component type based on shape characteristics
        
        Args:
            contour: Component contour
            area: Contour area
            width: Bounding box width
            height: Bounding box height
            
        Returns:
            Component type string
        """
        aspect_ratio = width / height if height > 0 else 1
        
        # Calculate circularity
        perimeter = cv2.arcLength(contour, True)
        if perimeter > 0:
            circularity = 4 * np.pi * area / (perimeter * perimeter)
        else:
            circularity = 0
        
        # Simple classification based on shape
        if circularity > 0.7:
            return "capacitor"
        elif aspect_ratio > 2 or aspect_ratio < 0.5:
            return "resistor"
        elif area > 1000:
            return "ic"
        else:
            return "component"
    
    def _analyze_component(self, component: Dict[str, Any], ref_img: np.ndarray, test_img: np.ndarray) -> Dict[str, Any]:
        """
        Analyze a single component for defects
        
        Args:
            component: Component information from reference image
            ref_img: Reference image
            test_img: Test image
            
        Returns:
            Component analysis result
        """
        template = component['template']
        expected_loc = component['expected_location']
        
        # Perform template matching
        result = cv2.matchTemplate(test_img, template, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        
        # Calculate detected center position
        h, w = template.shape
        detected_center = [max_loc[0] + w // 2, max_loc[1] + h // 2]
        
        # Calculate deviation from expected position
        deviation = np.sqrt((detected_center[0] - expected_loc[0])**2 + 
                           (detected_center[1] - expected_loc[1])**2)
        
        # Determine component status
        if max_val < self.confidence_threshold:
            status = "MISSING"
            detected_location = None
            deviation_pixels = None
        elif deviation > self.location_tolerance:
            status = "MISALIGNED"
            detected_location = detected_center
            deviation_pixels = float(deviation)
        else:
            status = "OK"
            detected_location = detected_center
            deviation_pixels = float(deviation)
        
        return {
            'name': component['name'],
            'status': status,
            'confidence': float(max_val),
            'expected_location': expected_loc,
            'detected_location': detected_location,
            'deviation_pixels': deviation_pixels,
            'component_type': component['type']
        }
    
    def _calculate_vr_position(self, image_coords: List[int]) -> Dict[str, float]:
        """
        Convert image coordinates to VR space coordinates
        
        Args:
            image_coords: [x, y] coordinates in image space
            
        Returns:
            VR position dictionary with x, y, z coordinates
        """
        # Normalize coordinates to 0-1 range and convert to VR space
        # This is a simplified mapping - in real applications this would involve
        # camera calibration and 3D reconstruction
        x_norm = image_coords[0] / 1920.0  # Assuming standard image width
        y_norm = image_coords[1] / 1080.0  # Assuming standard image height
        
        return {
            'x': float(x_norm - 0.5),  # Center at origin
            'y': 0.0,  # PCB surface level
            'z': float(0.5 - y_norm)   # Invert Y for VR space
        }
