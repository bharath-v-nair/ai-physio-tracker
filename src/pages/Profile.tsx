import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserProfile } from '../utils/useUserProfile';
import { User, Mail, Ruler, Weight, Target, Settings, Bell } from 'lucide-react';

export const Profile = () => {
  const profile = useUserProfile();
  const goals = profile?.rehabilitation_goal ? [profile.rehabilitation_goal] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center overflow-visible mt-8">
            <CardContent className="pt-0 relative px-4 pb-6">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 mx-auto -mt-12 shadow-md">
                <div className="w-full h-full rounded-xl bg-[#4F8EF7] flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.full_name?.charAt(0).toUpperCase() || ''}
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-4">{profile?.full_name}</h2>
              <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
              <Button variant="outline" className="w-full mt-6">Edit Profile</Button>
            </CardContent>
          </Card>
          
          <div className="space-y-1">
             <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#4F8EF7]/10 text-[#4F8EF7] rounded-xl font-medium transition-colors">
               <User className="w-5 h-5" />
               <span>Personal Info</span>
             </button>
             <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
               <Settings className="w-5 h-5" />
               <span>Account Settings</span>
             </button>
             <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
               <Bell className="w-5 h-5" />
               <span>Notifications</span>
             </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your physical metrics for accurate AI analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div key={profile?.id ?? 'loading'} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                   <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input type="number" defaultValue={profile?.age ?? ''} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4F8EF7] focus:outline-none" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input type="email" defaultValue={profile?.email ?? ''} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4F8EF7] focus:outline-none" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                   <div className="relative">
                     <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input type="text" defaultValue={profile?.height ? `${profile.height} cm` : ''} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4F8EF7] focus:outline-none" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                   <div className="relative">
                     <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input type="text" defaultValue={profile?.weight ? `${profile.weight} kg` : ''} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4F8EF7] focus:outline-none" />
                   </div>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Current Goals</label>
                 <div className="space-y-3">
                   {goals.map((goal, idx) => (
                     <div key={idx} className="flex items-center space-x-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800">
                       <Target className="w-5 h-5 text-blue-500 shrink-0" />
                       <span className="text-sm font-medium">{goal}</span>
                     </div>
                   ))}
                   <Button variant="outline" className="w-full border-dashed text-gray-500 hover:text-gray-700">
                     + Add New Goal
                   </Button>
                 </div>
               </div>

               <div className="pt-4 border-t border-gray-100 flex justify-end">
                 <Button>Save Changes</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
