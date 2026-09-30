import { BrandMark } from './DashboardLayout';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-lg font-bold text-ink">PhysioAI</span>
          </Link>

          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm font-medium text-muted hover:text-ink transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted hover:text-ink transition-colors">How it Works</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
