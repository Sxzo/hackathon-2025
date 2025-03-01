import { Link } from 'react-router-dom'
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { FaMagic } from "react-icons/fa";
import { FiLogOut, FiLogIn } from "react-icons/fi";
import { useAuth } from '../context/AuthContext';


const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-[#004977] text-white p-4 fixed top-0 w-full shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white flex items-center">
          <span className="mr-1">Finn</span> AI
        </Link>
        <div className="flex space-x-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-[#d03027] transition-colors">Dashboard</Link>
              <Link to="/chat" className="text-white hover:text-[#d03027] transition-colors">Chat</Link>
              <Link to="/settings" className="text-white hover:text-[#d03027] transition-colors">Settings</Link>
              <button 
                onClick={logout}
                className="text-white hover:text-[#d03027] transition-colors flex items-center"
              >
                <FiLogOut className="mr-1" /> Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="text-white hover:text-[#d03027] transition-colors flex items-center"
            >
              <FiLogIn className="mr-1" /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar 