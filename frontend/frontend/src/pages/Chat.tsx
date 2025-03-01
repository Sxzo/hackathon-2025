const Chat = () => {
  return (
    <div className="bg-gray-50 min-h-screen pt-4">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] flex flex-col border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#d03027]"></div>
          
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {/* AI Message */}
            <div className="mb-4 max-w-3xl">
              <div className="bg-white p-3 rounded-lg inline-block shadow-sm border border-gray-200">
                <p className="text-gray-800">
                  Hello! I'm <span className="text-[#d03027] font-medium">Finn</span>, your AI financial assistant. How can I help you today?
                </p>
              </div>
            </div>
            
            {/* User Message */}
            <div className="mb-4 max-w-3xl ml-auto">
              <div className="bg-[#004977] p-3 rounded-lg inline-block text-white shadow-sm">
                <p>
                  Can you analyze my spending habits this month?
                </p>
              </div>
            </div>
            
            {/* AI Response */}
            <div className="mb-4 max-w-3xl">
              <div className="bg-white p-3 rounded-lg inline-block shadow-sm border border-gray-200">
                <p className="text-gray-800">
                  Based on your transaction history, you've spent 15% more on dining out compared to last month. Your biggest expense category was shopping at <span className="text-[#d03027] font-medium">$520</span>, followed by groceries at $380.
                </p>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Ask Finn anything about your finances..."
                className="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
              />
              <button className="bg-[#d03027] hover:bg-[#b02a23] text-white px-6 py-3 rounded-lg transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat 