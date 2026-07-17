export const mockUserData = {
  name: "Alex Johnson",
  email: "alex.j@example.com",
  age: 32,
  height: "180 cm",
  weight: "75 kg",
  goals: ["Correct forward head posture", "Reduce lower back pain"],
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
};

export const mockDashboardData = {
  postureScore: 84,
  streak: 5,
  assessmentsThisWeek: 3,
  improvement: 12,
  recentAssessments: [
    { id: 1, date: "Today, 10:00 AM", type: "Full Body Posture", score: 85 },
    { id: 2, date: "Yesterday, 2:30 PM", type: "Desk Ergonomics", score: 82 },
    { id: 3, date: "Mon, 9:15 AM", type: "Full Body Posture", score: 78 },
  ]
};

export const mockExercises = [
  {
    id: 1,
    title: "Chin Tucks",
    category: "Neck",
    difficulty: "Beginner",
    duration: "5 mins",
    reps: "3 sets of 10",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 2,
    title: "Wall Angels",
    category: "Shoulder",
    difficulty: "Intermediate",
    duration: "8 mins",
    reps: "3 sets of 12",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 3,
    title: "Cat-Cow Stretch",
    category: "Back",
    difficulty: "Beginner",
    duration: "4 mins",
    reps: "2 sets of 15",
    image: "https://images.unsplash.com/photo-1552286450-3a5215099304?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 4,
    title: "Thoracic Extension",
    category: "Back",
    difficulty: "Intermediate",
    duration: "6 mins",
    reps: "3 sets of 10",
    image: "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&q=80&w=400"
  },
];
