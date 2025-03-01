import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-[#004977] text-white p-4 fixed top-0 w-full shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white flex items-center">
          <span className="mr-1">Finn</span> AI
        </Link>
        <div className="flex space-x-6">
          <Link to="/dashboard" className="text-white hover:text-[#d03027] transition-colors">Dashboard</Link>
          <Link to="/chat" className="text-white hover:text-[#d03027] transition-colors">Chat</Link>
          <Link to="/settings" className="text-white hover:text-[#d03027] transition-colors">Settings</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 