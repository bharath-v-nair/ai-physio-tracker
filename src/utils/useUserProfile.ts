import { useEffect, useState } from 'react';

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  rehabilitation_goal: string | null;
}

// Loads the logged-in user's details from the backend
export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  return profile;
};
