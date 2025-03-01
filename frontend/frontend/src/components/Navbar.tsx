import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4 fixed top-0 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Finn AI</Link>
        <div className="flex space-x-6">
          <Link to="/dashboard" className="hover:text-blue-300">Dashboard</Link>
          <Link to="/chat" className="hover:text-blue-300">Chat</Link>
          <Link to="/settings" className="hover:text-blue-300">Settings</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 