import json
from app.database.session import SessionLocal
from app.models.exercise import Exercise

def seed_exercises():
    db = SessionLocal()

    # Runs on every server start, so only seed an empty table.
    # Deleting existing exercises would break saved sessions and plans that point to them.
    existing = db.query(Exercise).count()
    if existing > 0:
        print(f"Exercises already seeded ({existing} found). Skipping.")
        db.close()
        return

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
                "Sit or stand tall with your shoulders relaxed.",
                "Look straight ahead and gently glide your head straight back, as if making a double chin.",
                "Keep your chin parallel to the floor, do not tilt it up or down.",
                "Hold for 3-5 seconds, then release."
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
            "name": "Doorway Chest Stretch",
            "body_part": "Chest",
            "target_muscle": "Pectoralis Major & Minor",
            "target_issue": "round_shoulder",
            "difficulty": "Beginner",
            "sets": 3,
            "repetitions": "1",
            "duration": "30 seconds",
            "description": "Opens up tight chest muscles caused by slouching.",
            "instructions": json.dumps([
                "Stand in an open doorway.",
                "Place your forearms on the doorframe, elbows bent at 90 degrees.",
                "Gently step one foot forward and lean your chest into the doorway until you feel a stretch.",
                "Hold for 30 seconds."
            ]),
            "common_mistakes": json.dumps(["Leaning with the head instead of the chest", "Elbows too high or too low"]),
            "tips": json.dumps(["Vary the height of your elbows to stretch different parts of the chest"]),
            "safety_notes": "Avoid overstretching, which can irritate the shoulder joint."
        },

        # UNEVEN SHOULDERS
        {
            "name": "Scapular Retraction (Uneven)",
            "body_part": "Back",
            "target_muscle": "Rhomboids",
            "target_issue": "uneven_shoulder",
            "difficulty": "Beginner",
            "sets": 3,
            "repetitions": "15",
            "duration": "5 minutes",
            "description": "A basic movement to train shoulder blade control and symmetry.",
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
            "name": "Shoulder Blade Squeeze",
            "body_part": "Back",
            "target_muscle": "Middle Trapezius",
            "target_issue": "uneven_shoulder",
            "difficulty": "Beginner",
            "sets": 3,
            "repetitions": "12",
            "duration": "5 minutes",
            "description": "Helps balance the muscles responsible for shoulder height.",
            "instructions": json.dumps([
                "Sit up straight in a chair.",
                "Keep your arms relaxed at your sides.",
                "Pull your shoulder blades back and down.",
                "Hold for 5 seconds."
            ]),
            "common_mistakes": json.dumps(["Lifting the shoulders while squeezing"]),
            "tips": json.dumps(["Use a mirror to ensure your shoulders remain level."]),
            "safety_notes": "Stop if you experience nerve pain."
        },
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

    for ex_data in exercises_data:
        exercise = Exercise(**ex_data)
        db.add(exercise)
        
    db.commit()
    print(f"Successfully seeded {len(exercises_data)} exercises.")
    db.close()

if __name__ == "__main__":
    seed_exercises()
