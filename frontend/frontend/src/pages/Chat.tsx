import { useState, useRef, useEffect } from 'react'
import { FcCancel } from 'react-icons/fc'
import { sendMessage } from '../services/chatService'

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
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([])
  const [token, setToken] = useState<string | null>(null)
  
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

  const promptBank = [
    "How much did I spend on groceries last month?",
    "What are my largest expenses?",
    "How much have I spent on dining out?",
    "Show me my recent transactions",
    "What's my average daily spending?",
    "How much did I spend on entertainment?",
    "What are my recurring subscriptions?",
    "How much have I spent on transportation?",
    "What was my biggest purchase last month?",
    "How much did I spend on online shopping?",
    "What's my spending pattern over the last month?",
    "How much have I spent on utilities?",
    "What categories do I spend the most on?",
    "How much did I spend last weekend?",
    "What's my average transaction amount?",
    "How much have I spent on healthcare?",
    "What's my spending trend this month?",
    "How much did I spend on travel?",
    "What's my total spending this month?",
    "How much have I spent on coffee shops?",
    "What's my largest recurring expense?",
    "How much did I spend on Amazon?",
    "What's my spending by day of week?",
    "How much have I spent on clothing?",
    "What's my average spending on weekends?",
    "How much did I spend on gas?",
    "What's my spending by time of day?",
    "How much have I spent on electronics?",
    "What's my spending compared to last month?",
    "How much did I spend on home improvement?"
  ]

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('finn_auth_token');
    if (storedToken) {
      console.log('Token found in localStorage:', storedToken.substring(0, 10) + '...');
      setToken(storedToken);
    } else {
      console.warn('No token found in localStorage');
    }
    
    // Randomly select 3 unique prompts from the prompt bank
    const getRandomPrompts = () => {
      const shuffled = [...promptBank].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    };
    
    setPromptSuggestions(getRandomPrompts());
  }, []);

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

    try {
      // Add a temporary "thinking" message
      const thinkingMessage = {
        id: messages.length + 2,
        text: "Thinking...",
        isAi: true
      }
      
      setMessages(prev => [...prev, thinkingMessage])
      
      // Send message to chatbot API
      if (token) {
        console.log('Sending message to chatbot service:', userMessage.text);
        const response = await sendMessage(userMessage.text, token);
        console.log('Received response from chatbot service:', response);
        
        // Replace the "thinking" message with the actual response
        setMessages(prev => 
          prev.map(msg => 
            msg.id === thinkingMessage.id 
              ? { ...msg, text: response.response } 
              : msg
          )
        );
        console.log('Updated messages with response:', response.response);
      } else {
        // If no token, replace with error message
        console.log('No token available, showing error message');
        setMessages(prev => 
          prev.map(msg => 
            msg.id === thinkingMessage.id 
              ? { ...msg, text: "Please log in to use the chatbot." } 
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Replace the "thinking" message with an error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messages.length + 2 
            ? { ...msg, text: "Sorry, there was an error processing your request. Please try again." } 
            : msg
        )
      )
    } finally {
      setIsOnCooldown(false)
      setAiThinkingTimeout(null)
    }
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

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt)
  }

  return (
    <div className="bg-white min-h-screen flex items-end justify-center pb-0">
      <div className={`w-full max-w-4xl mx-auto transition-all duration-700 ease-in-out rounded-lg overflow-hidden relative ${hasInteracted ? 'h-[calc(100vh-40px)] mt-[20px]' : 'h-[700px] mt-[40vh] mb-auto'}`}>
        <div className={`flex-1 w-full overflow-y-auto no-scrollbar transition-all duration-700 flex flex-col ${hasInteracted ? 'opacity-100 h-[calc(100vh-180px)]' : 'opacity-0 h-0'}`}>
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
          className={`w-full bg-white transition-all duration-700 ease-in-out ${hasInteracted ? 'px-0 py-0' : 'px-0 py-0'}`}
        >
          <div className="max-w-[95%] mx-auto">
            {!hasInteracted && (
              <>
                <h1 
                  className="text-2xl font-semibold text-gray-800 text-center mb-2 select-none"
                >
                  {displayText}
                  <span className="inline-block w-0.5 h-5 bg-gray-800 ml-0.5 animate-blink"></span>
                </h1>
                
                {/* Prompt Suggestions */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {promptSuggestions.map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1.5 rounded-full transition-colors duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="relative flex items-center animate-fadeIn animation-delay-300">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full rounded-lg pr-10 pl-2 py-2 bg-white text-gray-900 text-base focus:outline-none shadow-md focus:shadow-md transition-shadow duration-200"
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
                  className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Send message"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5"
                  >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chat 