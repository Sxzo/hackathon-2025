import { FiArrowRight, FiBarChart2, FiDollarSign, FiCalendar, FiMessageCircle, FiCheckCircle, FiTrendingUp, FiPieChart, FiSmartphone } from 'react-icons/fi';
import { BsGraphUp, BsShieldCheck, BsCreditCard2Front } from 'react-icons/bs';
import { TypeAnimation } from 'react-type-animation';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [isVisible, setIsVisible] = useState({
    features: false,
    howItWorks: false,
    cta: false
  });

  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.getElementById('features-section');
      const howItWorksSection = document.getElementById('how-it-works');
      const ctaSection = document.getElementById('cta-section');
      
      if (featuresSection) {
        const featuresPosition = featuresSection.getBoundingClientRect();
        setIsVisible(prev => ({
          ...prev,
          features: featuresPosition.top < window.innerHeight - 100
        }));
      }
      
      if (howItWorksSection) {
        const howItWorksPosition = howItWorksSection.getBoundingClientRect();
        setIsVisible(prev => ({
          ...prev,
          howItWorks: howItWorksPosition.top < window.innerHeight - 100
        }));
      }
      
      if (ctaSection) {
        const ctaPosition = ctaSection.getBoundingClientRect();
        setIsVisible(prev => ({
          ...prev,
          cta: ctaPosition.top < window.innerHeight - 100
        }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on mount to check initial visibility
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <div className="container mx-auto px-4 pt-16 pb-16">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left side - Text content */}
          <div className="md:w-1/2">
            <div className="flex items-center mb-4 bg-[#f0f7fc] px-4 py-2 rounded-full w-fit animate-fadeIn">
              <span className="ml-2 text-gray-600 text-sm font-medium">AI-Powered Financial Insights</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#004977]">
              Meet <span className="text-[#d03027]">Finn</span>, Your{" "}
              <span className="block mt-2">
                <TypeAnimation
                  sequence={[
                    'AI Financial Assistant',
                    2000,
                    'Budget Planner',
                    2000,
                    'Investment Advisor',
                    2000,
                    'Savings Coach',
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  className="text-[#004977]"
                />
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-fadeIn animation-delay-300">
              Let Finn help you manage your investments, track spending, and make smarter financial decisions with personalized AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn animation-delay-500">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 mt-8 text-lg font-medium text-white bg-[#d03027] rounded-lg hover:bg-[#b02a23] transition-colors"
              >
                Get Started <FiArrowRight className="ml-2" />
              </Link>
            </div>

          </div>
          
          {/* Right side - Chat preview */}
          <div className="md:w-1/2 mt-8 md:mt-0 animate-fadeInRight">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transform transition-all hover:scale-105 duration-300">
              {/* Chat header */}
              <div className="bg-[#004977] text-white p-4 flex items-center">
                <div className="font-medium flex items-center">
                  <FiMessageCircle className="mr-2" /> Chat with Finn
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="p-4 bg-gray-50">
                {/* AI Message */}
                <div className="mb-4 max-w-md">
                  <div className="bg-white p-3 rounded-lg shadow-sm inline-block border border-gray-200">
                    <p className="text-gray-800">
                      Hello! I'm <span className="text-[#d03027] font-medium">Finn</span>, your AI financial assistant. How can I help you today?
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
                
                {/* AI Response with typing animation */}
                <div className="mb-4 max-w-md">
                  <div className="bg-white p-3 rounded-lg shadow-sm inline-block border border-gray-200">
                    <p className="text-gray-800">
                      I'd be happy to help! Based on your spending history, I can suggest a savings plan. How much do you need for your vacation and{" "}
                      <span>when are you planning to go?</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features section */}
        <div id="features-section" className={`mt-24 transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl font-bold text-center text-[#004977] mb-12">How Finn helps you</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
              <div className="bg-[#f0f7fc] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#e1eef8] transition-colors">
                <FiBarChart2 className="text-[#004977] text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#004977]">Smart Budgeting</h3>
              <p className="text-gray-600">Get personalized budget recommendations based on your spending habits and financial goals.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
              <div className="bg-[#f0f7fc] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#e1eef8] transition-colors">
                <BsGraphUp className="text-[#004977] text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#004977]">Investment Insights</h3>
              <p className="text-gray-600">Receive AI-powered analysis of your investment portfolio and suggestions for optimization.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
              <div className="bg-[#f0f7fc] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#e1eef8] transition-colors">
                <FiSmartphone className="text-[#004977] text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#004977]">Weekly Mobile Updates</h3>
              <p className="text-gray-600">Get a weekly summary of your finances, including your spending, savings, and investment performance.</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}

export default Landing;