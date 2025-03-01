const Landing = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center">
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold mb-6">
            Your AI Financial Assistant
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Let Finn help you manage your investments, track spending, and make smarter financial decisions.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing 