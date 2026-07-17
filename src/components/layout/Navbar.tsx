import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4F8EF7] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">PhysioAI</span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
