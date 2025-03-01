import { useState, useRef, useEffect } from 'react'
import { FcCancel } from 'react-icons/fc'

interface Message {
  id: number;
  text: string;
  isAi: boolean;
}

const Chat = () => {
  const [hasInteracted, setHasInteracted] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isQuestionVisible, setIsQuestionVisible] = useState(true)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(50)
  const [aiThinkingTimeout, setAiThinkingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  
  const questions = [
    "How can I help with your finances today?",
    "What financial goals would you like to discuss?",
    "Need help with budgeting or planning?",
    "How can I assist you?",
    "Want to explore your investment options?",
    "Questions about saving or spending?",
    "Need guidance on your financial journey?",
    "Interested in retirement planning?",
    "Want to make smarter financial decisions?",
    "Ready to take control of your finances?"
  ]

  useEffect(() => {
    if (!hasInteracted) {
      const text = questions[currentQuestionIndex]
      
      if (isDeleting) {
        if (displayText === '') {
          setIsDeleting(false)
          setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
          setTypingSpeed(50)
        } else {
          const timeout = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1))
          }, 42)
          return () => clearTimeout(timeout)
        }
      } else {
        const targetText = questions[currentQuestionIndex]
        if (displayText === targetText) {
          const timeout = setTimeout(() => {
            setIsDeleting(true)
            setTypingSpeed(42)
          }, 7092)
          return () => clearTimeout(timeout)
        } else {
          const timeout = setTimeout(() => {
            setDisplayText(targetText.slice(0, displayText.length + 1))
          }, typingSpeed)
          return () => clearTimeout(timeout)
        }
      }
    }
  }, [hasInteracted, displayText, isDeleting, currentQuestionIndex, questions, typingSpeed])

  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isOnCooldown) return

    setIsOnCooldown(true)

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue.trim(),
      isAi: false
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    if (!hasInteracted) {
      setHasInteracted(true)
    }

    // Simulate AI response
    const timeout = setTimeout(() => {
      const aiResponses = [
        "I understand you're asking about that. Let me help you with that.",
        "Based on your question, I can provide some insights.",
        "That's an interesting question. Here's what I think:",
        "I can help you with that. Here's what you need to know:",
        "Let me analyze that for you."
      ]
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
      
      const aiMessage = {
        id: messages.length + 2,
        text: randomResponse,
        isAi: true
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsOnCooldown(false)
      setAiThinkingTimeout(null)
    }, 1000)

    setAiThinkingTimeout(timeout)
  }

  const handleCancel = () => {
    if (aiThinkingTimeout) {
      clearTimeout(aiThinkingTimeout)
      setAiThinkingTimeout(null)
      setIsOnCooldown(false)
      // Remove the last message (user's message)
      setMessages(prev => prev.slice(0, -1))
    }
  }

  return (
    <div className="bg-white min-h-screen flex">
      <div className={`w-full max-w-3xl mx-auto transition-all duration-700 ease-in-out rounded-lg overflow-hidden relative ${hasInteracted ? 'mt-[96px] h-[calc(100vh-112px)]' : 'h-[280px] self-center mt-[96px]'}`}>
        <div className={`flex-1 w-full overflow-y-auto no-scrollbar transition-all duration-700 flex flex-col ${hasInteracted ? 'opacity-100 h-[calc(100vh-232px)]' : 'opacity-0 h-0'}`}>
          {/* Chat Messages */}
          <div className="w-full flex-1 flex flex-col-reverse">
            <div ref={messagesEndRef} />
            {[...messages].reverse().map((message) => (
              <div 
                key={message.id} 
                className="px-4 py-6"
              >
                <div className="max-w-2xl mx-auto">
                  <div className={`flex ${message.isAi ? '' : 'justify-end'}`}>
                    <div 
                      className={`inline-block max-w-[90%] ${
                        message.isAi 
                          ? 'bg-white text-gray-800' 
                          : 'bg-[#004977] text-white'
                      } rounded-2xl px-4 py-3 animate-messageIn`}
                    >
                      <p className="text-[15px] leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSubmit} 
          className={`w-full bg-white transition-all duration-700 ease-in-out ${hasInteracted ? 'px-4 py-4' : 'px-4 py-4'}`}
        >
          <div className="max-w-2xl mx-auto">
            {!hasInteracted && (
              <h1 
                className="text-2xl font-semibold text-gray-800 text-center mb-8 select-none"
              >
                {displayText}
                <span className="inline-block w-0.5 h-5 bg-gray-800 ml-0.5 animate-blink"></span>
              </h1>
            )}
            <div className="relative flex items-center animate-fadeIn animation-delay-300">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full rounded-lg pr-12 pl-4 py-3 bg-white text-gray-900 text-sm focus:outline-none focus:ring-0 shadow-md transition-all duration-200"
              />
              {isOnCooldown && aiThinkingTimeout ? (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Cancel response"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5"
                  >
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <button 
                  type="submit"
                  className={`absolute right-2 p-1.5 transition-colors duration-200 ${
                    isOnCooldown 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  disabled={isOnCooldown}
                  aria-label="Send message"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5 -rotate-80"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="max-w-2xl mx-auto mt-2">
            {hasInteracted && (
              <p className="text-xs text-center text-gray-400 animate-fadeIn animation-delay-500">
                Finn is not flawless. Check important information.
              </p>
            )}
          </div>
        </form>
        {hasInteracted && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="w-full h-1 bg-red-500 rounded-b-lg" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat 