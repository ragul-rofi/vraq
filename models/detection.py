import cv2
import numpy as np
from datetime import datetime
import logging
from typing import List, Dict, Any, Tuple, Optional
from .image_processing import ImageProcessor

logger = logging.getLogger(__name__)

class DefectDetector:
    """PCB defect detection using enhanced vision techniques"""
    
    def __init__(self, config):
        self.config = config
        self.confidence_threshold = config.CONFIDENCE_THRESHOLD
        self.location_tolerance = config.LOCATION_TOLERANCE
        self.image_processor = ImageProcessor()  # Use the provided image processor
        
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
            
            # --- IMPROVEMENT 1: Use advanced image preprocessing ---
            # This makes the images more consistent and robust to lighting changes.
            ref_gray = self.image_processor.enhance_contrast(cv2.cvtColor(reference_img, cv2.COLOR_BGR2GRAY))
            test_gray = self.image_processor.enhance_contrast(cv2.cvtColor(test_img, cv2.COLOR_BGR2GRAY))
            
            # Detect components in reference image
            components = self._detect_components(ref_gray)
            
            component_results = []
            defect_markers = []
            overall_status = "OK"
            
            for component in components:
                # --- IMPROVEMENT 2: Use a more robust matching method ---
                # ORB is more robust to rotation and scale changes than simple template matching.
                result = self._analyze_component_orb(component, ref_gray, test_gray)
                component_results.append(result)
                
                if result['status'] != 'OK':
                    overall_status = "DEFECTS_FOUND"
                    defect_markers.append({
                        'position': self._calculate_vr_position(result['expected_location']),
                        'type': result['status'],
                        'component': result['name']
                    })
            
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
        Detect components in reference image using contour detection on an enhanced image
        """
        components = []
        
        # --- IMPROVEMENT 3: Use adaptive thresholding for better segmentation ---
        # This is more effective for uneven lighting.
        binary = self.image_processor.apply_adaptive_threshold(reference_img)
        
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        component_id = 1
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 100:
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            
            # --- IMPROVEMENT 4: Extract component template from original image
            # This preserves color information if needed for future enhancements.
            template = reference_img[y:y+h, x:x+w]
            
            center_x = x + w // 2
            center_y = y + h // 2
            
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
        """
        # (This remains the same for now, but could be enhanced with ML in the future)
        aspect_ratio = width / height if height > 0 else 1
        
        perimeter = cv2.arcLength(contour, True)
        if perimeter > 0:
            circularity = 4 * np.pi * area / (perimeter * perimeter)
        else:
            circularity = 0
        
        if circularity > 0.7:
            return "capacitor"
        elif aspect_ratio > 2 or aspect_ratio < 0.5:
            return "resistor"
        elif area > 1000:
            return "ic"
        else:
            return "component"
            
    def _analyze_component_orb(self, component: Dict[str, Any], ref_img: np.ndarray, test_img: np.ndarray) -> Dict[str, Any]:
        """
        Analyze a single component for defects using ORB feature matching
        
        This method is more robust than simple template matching.
        """
        # Initialize ORB detector
        orb = cv2.ORB_create()
        
        template_img = component['template']
        expected_loc = component['expected_location']
        
        # Find keypoints and descriptors
        kp1, des1 = orb.detectAndCompute(template_img, None)
        kp2, des2 = orb.detectAndCompute(test_img, None)
        
        if des1 is None or des2 is None:
            return {
                'name': component['name'],
                'status': "MISSING",
                'confidence': 0.0,
                'expected_location': expected_loc,
                'detected_location': None,
                'deviation_pixels': None,
                'component_type': component['type']
            }
            
        # Create a BFMatcher object
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        
        # Match descriptors
        matches = bf.match(des1, des2)
        
        # Sort them by distance
        matches = sorted(matches, key=lambda x: x.distance)
        
        # Find the best match
        if matches:
            best_match = matches[0]
            # Get the keypoint from the test image
            detected_kp = kp2[best_match.trainIdx]
            
            # The location is the keypoint position
            detected_center = [int(detected_kp.pt[0]), int(detected_kp.pt[1])]
            
            # Calculate deviation
            deviation = np.sqrt((detected_center[0] - expected_loc[0])**2 + (detected_center[1] - expected_loc[1])**2)
            
            # Confidence can be based on the match distance (lower is better)
            confidence = 1.0 - (best_match.distance / 100.0) # Normalize for a 0-1 range
            
            if confidence < self.confidence_threshold:
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
                'confidence': float(confidence),
                'expected_location': expected_loc,
                'detected_location': detected_location,
                'deviation_pixels': deviation_pixels,
                'component_type': component['type']
            }
        else:
            # No matches found
            return {
                'name': component['name'],
                'status': "MISSING",
                'confidence': 0.0,
                'expected_location': expected_loc,
                'detected_location': None,
                'deviation_pixels': None,
                'component_type': component['type']
            }
            
    def _calculate_vr_position(self, image_coords: List[int]) -> Dict[str, float]:
        """
        Convert image coordinates to VR space coordinates
        """
        # This function remains the same as it's a separate concern from detection accuracy.
        x_norm = image_coords[0] / 1920.0
        y_norm = image_coords[1] / 1080.0
        
        return {
            'x': float(x_norm - 0.5),
            'y': 0.0,
            'z': float(0.5 - y_norm)
        }