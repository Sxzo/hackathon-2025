# Financial Chatbot with Plaid Integration

This project implements a financial chatbot that fetches transaction history from Plaid and uses that context to answer user questions. The chatbot is built using LangChain and ChatGPT 4o mini.

##Devpost
See our Demo: https://devpost.com/software/finn-ai

## Setup

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your environment variables in the `.env` file:
```
# OpenAI configuration
OPENAI_API_KEY=your-openai-api-key
```

4. Run the backend server:
```bash
python run.py
```

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend/frontend
```

2. Install the required dependencies:
```bash
npm install
```

3. Run the frontend development server:
```bash
npm run dev
```

## Usage

1. Sign up or log in to the application
2. Link your bank account using Plaid
3. Navigate to the Chat page
4. Ask questions about your transaction history, such as:
   - "How much did I spend on groceries last month?"
   - "What are my largest expenses?"
   - "Show me my recent transactions"
   - "What's my average daily spending?"

## Architecture

The chatbot is built using the following components:

- **Backend**: Flask server with LangChain and OpenAI integration
- **Frontend**: React with TypeScript
- **Database**: MongoDB for storing user data and chat history
- **Plaid**: For fetching transaction history

## Implementation Details

The chatbot uses LangChain to create a conversational chain that:

1. Fetches the user's transaction history from Plaid
2. Formats the transaction history for the language model
3. Uses the transaction history as context for answering user questions
4. Maintains conversation history for context-aware responses

The system prompt instructs the model to act as a helpful financial assistant that uses the transaction history to provide personalized financial advice and answer questions.
