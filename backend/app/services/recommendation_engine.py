from sqlalchemy.orm import Session
from app.models.rehab_plan import RehabPlan, PlanExercise
from app.models.exercise import Exercise
from typing import List
import json

class RecommendationEngine:
    """
    A rule-based recommendation engine to map posture issues to exercises.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_recommendations(self, detected_issues: List[str], severity: str = "low") -> dict:
        """
        Takes a list of issues and returns either a list of exercises or a high severity warning.
        """
        if severity.lower() == "high":
            return {
                "warning": "Your assessment indicates a higher level of postural deviation. Consider consulting a qualified physiotherapist before beginning corrective exercises.",
                "recommendations": []
            }
            
        target_keys = []
        for issue in detected_issues:
            issue_lower = issue.lower()
            if "forward" in issue_lower or "neck" in issue_lower or "head" in issue_lower:
                target_keys.append("forward_neck")
            elif "round" in issue_lower:
                target_keys.append("round_shoulder")
            elif "uneven" in issue_lower:
                target_keys.append("uneven_shoulder")
            elif "lean" in issue_lower:
                if "left" in issue_lower:
                    target_keys.append("body_lean_left")
                elif "right" in issue_lower:
                    target_keys.append("body_lean_right")
                else:
                    target_keys.extend(["body_lean_left", "body_lean_right"])
                    
        # Remove duplicates
        target_keys = list(set(target_keys))
        
        if not target_keys:
            # Default maintenance
            exercises = self.db.query(Exercise).limit(3).all()
        else:
            exercises = self.db.query(Exercise).filter(Exercise.target_issue.in_(target_keys)).all()
            
        # Deduplicate exercises by ID (though DB handles it, just to be safe if manual appends happen)
        unique_exercises = {ex.id: ex for ex in exercises}
        
        # Sort/rank by ID for deterministic order
        sorted_exercises = sorted(unique_exercises.values(), key=lambda x: x.id)
        
        return {
            "warning": None,
            "recommendations": sorted_exercises
        }

    def generate_plan(self, user_id: int, assessment_id: int, detected_issues: List[str]) -> RehabPlan:
        """Generates and saves a new Rehab Plan based on detected issues."""
        
        active_plans = self.db.query(RehabPlan).filter(
            RehabPlan.user_id == user_id, 
            RehabPlan.status == "active"
        ).all()
        
        for plan in active_plans:
            plan.status = "completed"
            
        new_plan = RehabPlan(
            user_id=user_id,
            assessment_id=assessment_id,
            status="active"
        )
        self.db.add(new_plan)
        self.db.flush()
        
        rec_data = self.get_recommendations(detected_issues, "low")
        exercises = rec_data["recommendations"]
        
        for ex in exercises:
            plan_ex = PlanExercise(
                plan_id=new_plan.id,
                exercise_id=ex.id,
                sets=ex.sets or 3,
                repetitions=int(ex.repetitions) if ex.repetitions and ex.repetitions.isdigit() else 10,
                duration_seconds=30 if "Stretch" in ex.name else None
            )
            self.db.add(plan_ex)
            
        self.db.commit()
        self.db.refresh(new_plan)
        
        return new_plan
