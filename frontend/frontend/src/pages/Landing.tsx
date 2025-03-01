const Landing = () => {
  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left side - Text content */}
          <div className="md:w-1/2">
            <div className="flex items-center mb-2">
              <span className="ml-2 text-gray-600">AI-Powered Financial Insights</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 text-[#004977]">
              Meet <span className="text-[#d03027]">Finn</span>, Your AI Financial Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Let Finn help you manage your investments, track spending, and make smarter financial decisions with personalized AI-powered insights.
            </p>
            <div className="flex gap-4">
              <button className="bg-[#d03027] hover:bg-[#b02a23] text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                Get Started
              </button>
              <button className="border border-[#004977] text-[#004977] hover:bg-[#f0f7fc] px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                Learn More
              </button>
            </div>
          </div>
          
          {/* Right side - Chat preview */}
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              {/* Chat header */}
              <div className="bg-[#004977] text-white p-4 flex items-center">
                <div className="font-medium">Chat with Finn</div>
              </div>
              
              {/* Chat messages */}
              <div className="p-4 bg-gray-50">
                {/* AI Message */}
                <div className="mb-4 max-w-md">
                  <div className="bg-white p-3 rounded-lg shadow-sm inline-block border border-gray-200">
                    <p className="text-gray-800">
                      Hello! I'm <span className="font-medium">Finn</span>, your AI financial assistant. How can I help you today?
                    </p>
                  </div>
                </div>
                
                {/* User Message */}
                <div className="mb-4 max-w-md ml-auto">
                  <div className="bg-[#004977] p-3 rounded-lg shadow-sm inline-block text-white">
                    <p>
                      I need to save for a vacation. Can you help me create a budget?
                    </p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="mb-4 max-w-md">
                  <div className="bg-white p-3 rounded-lg shadow-sm inline-block border border-gray-200">
                    <p className="text-gray-800">
                      I'd be happy to help! Based on your spending history, I can suggest a savings plan. How much do you need for your vacation and <span className="font-medium">when are you planning to go?</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#f0f7fc] p-6 rounded-lg border border-[#e1eef8] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
            <h3 className="text-xl font-semibold mb-3 text-[#004977]">Smart Budgeting</h3>
            <p className="text-gray-600">Get personalized budget recommendations based on your spending habits and financial goals.</p>
          </div>
          <div className="bg-[#f0f7fc] p-6 rounded-lg border border-[#e1eef8] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
            <h3 className="text-xl font-semibold mb-3 text-[#004977]">Investment Insights</h3>
            <p className="text-gray-600">Receive AI-powered analysis of your investment portfolio and suggestions for optimization.</p>
          </div>
          <div className="bg-[#f0f7fc] p-6 rounded-lg border border-[#e1eef8] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
            <h3 className="text-xl font-semibold mb-3 text-[#004977]">Financial Planning</h3>
            <p className="text-gray-600">Plan for major life events with customized savings strategies and financial roadmaps.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing;