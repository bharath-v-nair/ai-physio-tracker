import cv2
import numpy as np
import base64
import mediapipe as mp
from typing import Tuple, Dict, Any, List

class PoseDetector:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def decode_frame(self, base64_string: str) -> np.ndarray:
        """Decode base64 string (data URI) to OpenCV image."""
        try:
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            img_bytes = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Failed to decode image: {e}")
            return None

    def process_frame(self, base64_string: str) -> Tuple[List[Dict[str, float]], Tuple[int, int]]:
        """
        Process the base64 frame, return landmarks and image dimensions.
        """
        image = self.decode_frame(base64_string)
        if image is None:
            return [], (0, 0)
            
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = self.pose.process(image_rgb)
        
        landmarks = []
        if results.pose_landmarks:
            for lm in results.pose_landmarks.landmark:
                landmarks.append({
                    "x": lm.x,
                    "y": lm.y,
                    "z": lm.z,
                    "visibility": lm.visibility
                })
                
        h, w, _ = image.shape
        return landmarks, (w, h)
        
    def __del__(self):
        self.pose.close()
