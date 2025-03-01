const Chat = () => {
  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow h-[calc(100vh-120px)] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* AI Message */}
            <div className="mb-4 max-w-3xl">
              <div className="bg-gray-100 p-3 rounded-lg inline-block">
                <p className="text-gray-800">
                  Hello! I'm Finn, your AI financial assistant. How can I help you today?
                </p>
              </div>
            </div>
            
            {/* User Message */}
            <div className="mb-4 max-w-3xl ml-auto">
              <div className="bg-blue-600 p-3 rounded-lg inline-block text-white">
                <p>
                  Can you analyze my spending habits this month?
                </p>
              </div>
            </div>
            
            {/* AI Response */}
            <div className="mb-4 max-w-3xl">
              <div className="bg-gray-100 p-3 rounded-lg inline-block">
                <p className="text-gray-800">
                  Based on your transaction history, you've spent 15% more on dining out compared to last month. Your biggest expense category was shopping at $520, followed by groceries at $380.
                </p>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Ask Finn anything about your finances..."
                className="flex-1 rounded-lg border p-3"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
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