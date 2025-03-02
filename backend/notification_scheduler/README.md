# Notification Scheduler

A Python-based notification scheduler that sends personalized financial insights via Telegram. The system retrieves user data from MongoDB, processes transaction information, and delivers AI-enhanced notifications based on user preferences and timezone settings.

## Features

- **Telegram Integration**: Sends notifications via Telegram instead of SMS
- **MongoDB Integration**: Stores user data and preferences
- **Timezone Awareness**: Respects user timezones when determining notification times
- **Time Rounding**: Rounds notification times to the nearest minute to ensure consistent delivery
- **AI-Powered Insights**: Uses OpenAI to generate personalized financial insights based on transaction data
- **Customizable Notification Schedule**: Allows users to set preferred notification times

## Setup

### Prerequisites

- Python 3.8+
- MongoDB
- Telegram Bot
- OpenAI API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials

### Creating a Telegram Bot

1. Start a chat with BotFather (@BotFather) on Telegram
2. Send the command `/newbot` and follow the instructions
3. Copy the bot token provided by BotFather
4. Add the token to your `.env` file as `TELEGRAM_BOT_TOKEN`

### Getting Your Telegram Chat ID

1. Start a chat with your bot
2. Send any message to the bot
3. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat` object and note the `id` field
5. Add this ID to your `.env` file as `CHANNEL_ID`

### Setting Up OpenAI API

1. Create an account on [OpenAI](https://platform.openai.com/)
2. Generate an API key in your account settings
3. Add the API key to your `.env` file as `OPENAI_API_KEY`
4. Optionally, specify a different model in your `.env` file as `OPENAI_MODEL` (default is gpt-4o-mini)

## User Schema

The MongoDB collection stores user documents with the following structure:

```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "telegram_chat_id": "123456789",
  "notification_time": "09:00",
  "timezone": "America/New_York",
  "budget": {
    "groceries": 300,
    "dining": 200,
    "entertainment": 150
  },
  "transactions": [
    {
      "date": "2023-04-15",
      "amount": 45.67,
      "category": "groceries",
      "merchant": "Whole Foods"
    }
  ]
}
```

## Timezone Handling

The notification scheduler is designed to respect each user's timezone when determining notification times:

1. Each user document includes a `timezone` field (e.g., "America/New_York", "Europe/London")
2. The scheduler converts the user's notification time to UTC for internal processing
3. When checking if a notification should be sent, the current time is compared in the user's local timezone
4. The system rounds times to the nearest minute to ensure notifications are not missed due to second/microsecond discrepancies

This approach ensures that users receive notifications at their preferred local time, regardless of where they are located or where the server is hosted.

## AI-Powered Insights

The notification scheduler uses OpenAI to generate personalized financial insights:

1. Transaction data and budget information are analyzed to identify spending patterns
2. The OpenAI API is called with a carefully crafted prompt that includes:
   - Recent transaction details
   - Budget allocations and remaining amounts
   - Spending trends across categories
3. The AI generates insights such as:
   - Budget adherence recommendations
   - Spending pattern observations
   - Personalized saving tips
   - Category-specific advice

These AI-powered insights are included in the Telegram notifications, providing users with more valuable and actionable information about their financial situation.

## Running the Scheduler

```
python scheduler.py
```

The scheduler will run continuously, checking for users who should receive notifications based on their preferred notification time and timezone.

## Testing

You can add a test user to the database using the provided script:

```
python add_test_user.py
```

Make sure to edit the script first to include your Telegram chat ID.

## Diagnostic Tool

To check if MongoDB is properly configured and see which users are scheduled for notifications:

```
python check_mongodb.py
```

This will show:
- MongoDB connection status
- Database and collection information
- List of users with notifications enabled
- Current time in each user's timezone (both exact and rounded)
- Whether it's currently notification time for each user

## Running as a Service

For production use, you should run the scheduler as a service using a process manager like Supervisor or systemd.

### Example systemd service file

Create a file at `/etc/systemd/system/financial-notifications.service`:

```
[Unit]
Description=Financial Notification Scheduler
After=network.target

[Service]
User=yourusername
WorkingDirectory=/path/to/notification_scheduler
ExecStart=/usr/bin/python3 /path/to/notification_scheduler/scheduler.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```
sudo systemctl enable financial-notifications
sudo systemctl start financial-notifications
```

## Logging

Logs are written to `notification_scheduler.log` in the application directory and also output to the console.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 