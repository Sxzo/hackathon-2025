import { Link, useLocation } from 'react-router-dom'
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { FaMagic } from "react-icons/fa";
import { FiLogOut, FiLogIn, FiUser, FiHome, FiPieChart, FiSettings, FiMessageSquare } from "react-icons/fi";
import { useAuth } from '../context/AuthContext';
import finnLogo from '../../public/finn_logo.png';
const Navbar = () => {
  const { isAuthenticated, logout, firstName, lastName } = useAuth();
  const location = useLocation();

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md transition-colors ${
        isActivePath(to)
          ? 'bg-[#004977] text-white'
          : 'text-gray-700 hover:bg-[#004977] hover:text-white'
      }`}
    >
      <Icon className="mr-2" />
      {label}
    </Link>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/" className="text-[#004977] text-xl font-bold flex items-center">
            <img 
                src={finnLogo} 
                alt="Finn AI Logo" 
                className="h-8 w-auto mr-2"
              />
              Finn AI
            </Link>
          </div>
          
          {isAuthenticated && (
            <div className="flex-1 hidden md:flex justify-center space-x-2 mx-8">
              <NavLink to="/dashboard" icon={FiHome} label="Dashboard" />
              <NavLink to="/chat" icon={FiMessageSquare} label="Chat" />
              <NavLink to="/settings" icon={FiSettings} label="Settings" />
            </div>
          )}
          
          <div className="flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-[#004977] flex items-center justify-center">
                    <FiUser className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      {firstName} {lastName}
                    </span>
                    <span className="text-xs text-gray-500">Member</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Logout"
                >
                  <FiLogOut className="text-[#004977] hover:text-[#003d66]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#004977] hover:bg-[#003d66] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 border border-[#d03027] text-sm font-medium rounded-md text-[#d03027] hover:bg-[#d03027] hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 