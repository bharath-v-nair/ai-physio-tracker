import json
from app.database.session import SessionLocal
from app.models.exercise import Exercise

# Removed from the library because they repeat another exercise
RETIRED = ["Doorway Chest Stretch", "Scapular Retraction (Uneven)", "Shoulder Blade Squeeze"]


def seed_exercises():
    db = SessionLocal()

    exercises_data = [
        # FORWARD HEAD
        {
            "name": "Chin Tucks",
            "body_part": "Neck",
            "target_muscle": "Deep Cervical Flexors",
            "target_issue": "forward_neck",
            "difficulty": "Beginner",
            "sets": 3,
            "repetitions": "10",
            "duration": "5 minutes",
            "description": "A simple exercise to strengthen the deep neck muscles and correct forward head posture.",
            "instructions": json.dumps([
                "Turn your chair so one shoulder points at the screen: the camera needs to see you from the side.",
                "Sit tall with your shoulders relaxed and look straight ahead.",
                "Gently glide your head straight back, as if making a double chin.",
                "Keep your chin level: don't nod down or tilt it up.",
                "Hold for 2-5 seconds, then relax forward. The app says each rep out loud."
            ]),
            "common_mistakes": json.dumps(["Tilting the head up or down", "Shrugging the shoulders"]),
            "tips": json.dumps(["Imagine a string pulling the top of your head up", "Place a finger on your chin to guide the movement"]),
            "safety_notes": "Stop if you feel sharp pain or dizziness."
        },
        {
            "name": "Cervical Retraction",
            "body_part": "Neck",
            "target_muscle": "Cervical Extensors",
            "target_issue": "forward_neck",
            "difficulty": "Intermediate",
            "sets": 3,
            "repetitions": "10",
            "duration": "5 minutes",
            "description": "Improves neck alignment by actively pulling the head back over the spine.",
            "instructions": json.dumps([
                "Lie on your back with a small towel under your neck.",
                "Gently press the back of your neck into the towel.",
                "Hold for 5 seconds.",
                "Release and repeat."
            ]),
            "common_mistakes": json.dumps(["Lifting the head off the floor", "Holding breath"]),
            "tips": json.dumps(["Keep your jaw relaxed."]),
            "safety_notes": "Avoid if you have acute cervical herniation."
        },
        {
            "name": "Doorway Stretch",
            "body_part": "Chest",
            "target_muscle": "Pectorals",
            "target_issue": "forward_neck",
            "difficulty": "Beginner",
            "sets": 3,
            "repetitions": "1",
            "duration": "30 seconds",
            "description": "Opens the chest to reduce the anterior pull on the neck.",
            "instructions": json.dumps([
                "Stand in a doorway with your forearms on the frame.",
                "Step one foot forward and gently lean your body through the door.",
                "Feel the stretch across your chest.",
                "Hold for 30 seconds."
            ]),
            "common_mistakes": json.dumps(["Arching the lower back", "Leaning with the head first"]),
            "tips": json.dumps(["Keep your core engaged to protect the lower back."]),
            "safety_notes": "Do not push through shoulder joint pain."
        },
        
        # ROUNDED SHOULDERS
        {
            "name": "Wall Angels",
            "body_part": "Shoulders",
            "target_muscle": "Mid/Lower Trapezius, Rhomboids",
            "target_issue": "round_shoulder",
            "difficulty": "Intermediate",
            "sets": 3,
            "repetitions": "10",
            "duration": "5 minutes",
            "description": "Excellent for correcting rounded shoulders and improving thoracic mobility.",
            "instructions": json.dumps([
                "Stand with your back against a wall, feet slightly forward.",
                "Ensure your head, upper back, and buttocks are touching the wall.",
                "Raise your arms to 90 degrees (goalpost position) with elbows and wrists against the wall.",
                "Slowly slide your arms up the wall as far as you can without losing contact.",
                "Slide back down to the starting position."
            ]),
            "common_mistakes": json.dumps(["Arching the lower back to keep arms on the wall", "Letting the head come off the wall"]),
            "tips": json.dumps(["Keep your core tight", "Only go as high as you can maintain form"]),
            "safety_notes": "Don't force range of motion if you feel pinching in the shoulders."
        },
        {
            "name": "Scapular Retraction",
            "body_part": "Back",
            "target_muscle": "Rhomboids",
            "target_issue": "round_shoulder",
            "difficulty": "Beginner",
            "sets": 3,
            "repetitions": "15",
            "duration": "5 minutes",
            "description": "A basic movement to train shoulder blade control.",
            "instructions": json.dumps([
                "Sit or stand tall.",
                "Squeeze your shoulder blades together as if trying to hold a pencil between them.",
                "Hold for 3-5 seconds.",
                "Relax and repeat."
            ]),
            "common_mistakes": json.dumps(["Shrugging the shoulders up towards the ears"]),
            "tips": json.dumps(["Focus on moving the shoulder blades backward and slightly down"]),
            "safety_notes": "None"
        },

        {
            "name": "Neck Side-Bend Stretch",
            "body_part": "Neck",
            "target_muscle": "Upper Trapezius & Scalenes",
            "target_issue": "forward_neck",
            "difficulty": "Beginner",
            "sets": 1,
            "repetitions": "6",
            "duration": "3 minutes",
            "description": "Eases the neck and upper-shoulder tension that builds up during long hours at a desk.",
            "instructions": json.dumps([
                "Sit tall facing the camera, shoulders relaxed and level.",
                "Slowly tilt one ear towards the same shoulder until you feel a gentle stretch.",
                "Hold for 5 seconds while breathing slowly.",
                "Bring your head back to the middle, then repeat on the other side."
            ]),
            "common_mistakes": json.dumps(["Turning the head instead of tilting it", "Lifting the shoulder up to meet the ear"]),
            "tips": json.dumps(["Let the weight of your head do the work", "Keep your nose pointing at the screen"]),
            "safety_notes": "Stretch only to a gentle pull. Stop if you feel tingling or pain down the arm."
        },
        {
            "name": "Shoulder Shrugs",
            "body_part": "Shoulders",
            "target_muscle": "Upper Trapezius",
            "target_issue": "uneven_shoulder",
            "difficulty": "Beginner",
            "sets": 2,
            "repetitions": "10",
            "duration": "3 minutes",
            "description": "Builds even strength in the muscles that lift the shoulders and relieves desk-work tension.",
            "instructions": json.dumps([
                "Sit tall facing the camera with your arms relaxed.",
                "Lift both shoulders straight up towards your ears.",
                "Hold for 1 second at the top.",
                "Lower them slowly and evenly."
            ]),
            "common_mistakes": json.dumps(["Lifting one shoulder more than the other", "Rolling the head forward"]),
            "tips": json.dumps(["Move both shoulders together, like an elevator"]),
            "safety_notes": "Keep the movement slow and pain-free."
        },
        # UNEVEN SHOULDERS
        {
            "name": "Wall Posture Hold",
            "body_part": "Full Body",
            "target_muscle": "Postural Stabilizers",
            "target_issue": "uneven_shoulder",
            "difficulty": "Intermediate",
            "sets": 3,
            "repetitions": "1",
            "duration": "1 minute",
            "description": "Trains the brain to recognize symmetrical alignment.",
            "instructions": json.dumps([
                "Stand with your heels, glutes, upper back, and head against a wall.",
                "Ensure both shoulders are in contact with the wall at the same height.",
                "Hold this position actively for 60 seconds."
            ]),
            "common_mistakes": json.dumps(["Over-arching the lower back"]),
            "tips": json.dumps(["Have someone check your shoulder height, or use a mirror."]),
            "safety_notes": "None"
        },

        # BODY LEAN LEFT / RIGHT
        {
            "name": "Postural Alignment Stretch",
            "body_part": "Spine",
            "target_muscle": "Erector Spinae",
            "target_issue": "body_lean_left",
            "difficulty": "Beginner",
            "sets": 2,
            "repetitions": "1",
            "duration": "30 seconds",
            "description": "Helps lengthen the side of the torso that is compressed.",
            "instructions": json.dumps([
                "Stand tall with your feet hip-width apart.",
                "Reach both arms overhead.",
                "Gently lean your upper body away from the direction of your lean.",
                "Hold the stretch."
            ]),
            "common_mistakes": json.dumps(["Twisting the torso while leaning"]),
            "tips": json.dumps(["Keep your weight evenly distributed on both feet."]),
            "safety_notes": "Move slowly to avoid muscle spasms."
        },
        {
            "name": "Standing Side Stretch",
            "body_part": "Spine",
            "target_muscle": "Quadratus Lumborum",
            "target_issue": "body_lean_left",
            "difficulty": "Beginner",
            "sets": 2,
            "repetitions": "1",
            "duration": "30 seconds",
            "description": "Directly stretches the lateral muscles of the torso.",
            "instructions": json.dumps([
                "Stand straight, cross one leg behind the other.",
                "Reach the arm on the same side overhead.",
                "Lean to the opposite side until you feel a stretch along your ribs and hip.",
                "Hold for 30 seconds."
            ]),
            "common_mistakes": json.dumps(["Leaning forward or backward instead of purely sideways"]),
            "tips": json.dumps(["Imagine you are standing between two panes of glass."]),
            "safety_notes": "Avoid if you have acute lower back pain."
        },
        {
            "name": "Core Stability Exercise",
            "body_part": "Core",
            "target_muscle": "Obliques, Transverse Abdominis",
            "target_issue": "body_lean_left",
            "difficulty": "Intermediate",
            "sets": 3,
            "repetitions": "12",
            "duration": "5 minutes",
            "description": "Strengthens the core to maintain an upright, centered posture.",
            "instructions": json.dumps([
                "Lie on your back with knees bent and feet flat.",
                "Brace your core as if preparing for a punch.",
                "Slowly lift one foot off the floor slightly, without letting your hips tilt.",
                "Lower and alternate sides."
            ]),
            "common_mistakes": json.dumps(["Letting the hips rock side to side"]),
            "tips": json.dumps(["Place your hands on your hip bones to monitor movement."]),
            "safety_notes": "Keep breathing steadily; do not hold your breath."
        },
        
        # Duplicate Lean for RIGHT
        {
            "name": "Postural Alignment Stretch (Right)",
            "body_part": "Spine",
            "target_muscle": "Erector Spinae",
            "target_issue": "body_lean_right",
            "difficulty": "Beginner",
            "sets": 2,
            "repetitions": "1",
            "duration": "30 seconds",
            "description": "Helps lengthen the side of the torso that is compressed.",
            "instructions": json.dumps([
                "Stand tall with your feet hip-width apart.",
                "Reach both arms overhead.",
                "Gently lean your upper body away from the direction of your lean.",
                "Hold the stretch."
            ]),
            "common_mistakes": json.dumps(["Twisting the torso while leaning"]),
            "tips": json.dumps(["Keep your weight evenly distributed on both feet."]),
            "safety_notes": "Move slowly to avoid muscle spasms."
        },
        {
            "name": "Standing Side Stretch (Right)",
            "body_part": "Spine",
            "target_muscle": "Quadratus Lumborum",
            "target_issue": "body_lean_right",
            "difficulty": "Beginner",
            "sets": 2,
            "repetitions": "1",
            "duration": "30 seconds",
            "description": "Directly stretches the lateral muscles of the torso.",
            "instructions": json.dumps([
                "Stand straight, cross one leg behind the other.",
                "Reach the arm on the same side overhead.",
                "Lean to the opposite side until you feel a stretch along your ribs and hip.",
                "Hold for 30 seconds."
            ]),
            "common_mistakes": json.dumps(["Leaning forward or backward instead of purely sideways"]),
            "tips": json.dumps(["Imagine you are standing between two panes of glass."]),
            "safety_notes": "Avoid if you have acute lower back pain."
        },
        {
            "name": "Core Stability Exercise (Right)",
            "body_part": "Core",
            "target_muscle": "Obliques, Transverse Abdominis",
            "target_issue": "body_lean_right",
            "difficulty": "Intermediate",
            "sets": 3,
            "repetitions": "12",
            "duration": "5 minutes",
            "description": "Strengthens the core to maintain an upright, centered posture.",
            "instructions": json.dumps([
                "Lie on your back with knees bent and feet flat.",
                "Brace your core as if preparing for a punch.",
                "Slowly lift one foot off the floor slightly, without letting your hips tilt.",
                "Lower and alternate sides."
            ]),
            "common_mistakes": json.dumps(["Letting the hips rock side to side"]),
            "tips": json.dumps(["Place your hands on your hip bones to monitor movement."]),
            "safety_notes": "Keep breathing steadily; do not hold your breath."
        }
    ]

    # Runs on every server start. Exercises are matched by name: new ones are added and
    # existing ones updated in place, so saved sessions and plans keep pointing at the same rows.
    added = updated = 0
    for ex_data in exercises_data:
        exercise = db.query(Exercise).filter(Exercise.name == ex_data["name"]).first()
        if exercise:
            for field, value in ex_data.items():
                setattr(exercise, field, value)
            updated += 1
        else:
            db.add(Exercise(**ex_data))
            added += 1

    # Duplicates of other exercises: hidden from the library and from new plans, never deleted
    retired = db.query(Exercise).filter(Exercise.name.in_(RETIRED)).all()
    for exercise in retired:
        exercise.target_issue = "retired"

    db.commit()
    print(f"Exercises: {added} added, {updated} updated, {len(retired)} retired.")
    db.close()

if __name__ == "__main__":
    seed_exercises()
