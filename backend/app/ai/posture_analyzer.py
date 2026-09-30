from typing import Dict, Any, List
from app.ai.landmark_utils import calculate_angle, calculate_slope_angle, calculate_distance

class PostureAnalyzer:
    def analyze(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Analyze posture from MediaPipe landmarks.
        landmarks: List of dicts with x, y, z, visibility.
        """
        if not landmarks or len(landmarks) < 33:
            return {"score": 0, "issues": [], "confidence": 0}
            
        issues = []
        score = 100
        
        # We need landmarks for Ear, Shoulder, Hip
        # MediaPipe indices:
        # LEFT_EAR = 7, RIGHT_EAR = 8
        # LEFT_SHOULDER = 11, RIGHT_SHOULDER = 12
        # LEFT_HIP = 23, RIGHT_HIP = 24
        
        try:
            # 1. Head Tilt / Side Shift
            # With a front-facing camera we can't see the head move forward, but we can
            # see it drift or tilt sideways: compare the midpoint of the ears with the
            # midpoint of the shoulders, relative to shoulder width.
            shoulder_width = calculate_distance(
                (landmarks[11]['x'], landmarks[11]['y']), 
                (landmarks[12]['x'], landmarks[12]['y'])
            )
            mid_ear_x = (landmarks[7]['x'] + landmarks[8]['x']) / 2
            mid_shoulder_x = (landmarks[11]['x'] + landmarks[12]['x']) / 2
            head_offset_ratio = abs(mid_ear_x - mid_shoulder_x) / (shoulder_width + 1e-6)
            
            if head_offset_ratio > 0.12:
                issues.append({
                    "name": "Head Tilt / Side Shift",
                    "severity": "High" if head_offset_ratio > 0.2 else "Moderate",
                    "recommendation": "Bring your head back to the centre, level your ears and keep them over your shoulders."
                })
                score -= 20 if head_offset_ratio > 0.2 else 10
                
            # 2. Uneven Shoulders
            left_shoulder = (landmarks[11]['x'], landmarks[11]['y'])
            right_shoulder = (landmarks[12]['x'], landmarks[12]['y'])
            shoulder_slope = abs(calculate_slope_angle(left_shoulder, right_shoulder))
            # 0 or 180 is perfectly horizontal
            shoulder_deviation = min(shoulder_slope, abs(180 - shoulder_slope))
            
            if shoulder_deviation > 5:
                issues.append({
                    "name": "Uneven Shoulders",
                    "severity": "High" if shoulder_deviation > 10 else "Moderate",
                    "recommendation": "Relax your shoulders. Ensure one isn't shrugging higher than the other."
                })
                score -= 15 if shoulder_deviation > 10 else 5
                
            # 3. Body Lean
            # Midpoint of shoulders to midpoint of hips
            mid_shoulder = (
                (landmarks[11]['x'] + landmarks[12]['x']) / 2,
                (landmarks[11]['y'] + landmarks[12]['y']) / 2
            )
            mid_hip = (
                (landmarks[23]['x'] + landmarks[24]['x']) / 2,
                (landmarks[23]['y'] + landmarks[24]['y']) / 2
            )
            torso_slope = abs(calculate_slope_angle(mid_hip, mid_shoulder))
            torso_deviation = abs(90 - torso_slope)
            
            if torso_deviation > 5:
                issues.append({
                    "name": "Body Lean",
                    "severity": "High" if torso_deviation > 10 else "Moderate",
                    "recommendation": "Stand up straight and distribute your weight evenly."
                })
                score -= 15 if torso_deviation > 10 else 5
                
            # Confidence based on landmark visibility
            confidence_sum = sum(lm.get('visibility', 0) for lm in landmarks[11:25])
            confidence = min(100.0, (confidence_sum / 14) * 100)
            
            return {
                "score": max(0, score),
                "issues": issues,
                "confidence": confidence
            }
            
        except Exception as e:
            print(f"Analysis error: {e}")
            return {"score": 0, "issues": [], "confidence": 0}
