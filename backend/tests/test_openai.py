import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenAI API key
api_key = os.environ.get('OPENAI_API_KEY')
if not api_key:
    print("Error: OPENAI_API_KEY not found in environment variables")
    exit(1)

# Initialize OpenAI client with the new format
client = OpenAI(api_key=api_key)

# Test OpenAI API
try:
    print("Testing OpenAI API...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ],
        temperature=0.7,
        max_tokens=50
    )
    
    # Print response
    print("\nResponse:")
    print(response.choices[0].message.content)
    print("\nAPI test successful!")
    
except Exception as e:
    print(f"Error: {str(e)}")
    exit(1) 