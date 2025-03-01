# Financial Notification Scheduler

This system automatically sends Telegram notifications to users with a summary of their recent financial transactions based on their preferred notification time, respecting each user's timezone.

## Features

- Checks MongoDB for users who should receive notifications at the current time
- Respects each user's timezone when determining notification time
- Rounds time to the nearest minute to ensure notifications are sent at the exact time
- Fetches recent transaction data from Plaid
- Generates a summary of financial activity
- Sends personalized Telegram notifications
- Runs as a scheduled service that checks for notifications every minute

## Prerequisites

- Python 3.8+
- MongoDB database with user information
- Plaid API credentials
- Telegram Bot Token (create a bot using BotFather)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your configuration details:
   ```
   cp .env.example .env
   ```

## Configuration

Edit the `.env` file with your credentials:

```
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=finn_ai
MONGODB_COLLECTION=users

# Plaid API Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # sandbox, development, or production

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## Creating a Telegram Bot

1. Open Telegram and search for "BotFather"
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to create a new bot
4. Once created, BotFather will provide you with a token - add this to your `.env` file as `TELEGRAM_BOT_TOKEN`
5. Start a chat with your new bot and send a message to it
6. To get your chat ID, visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser after sending a message to the bot
7. Look for the `"chat":{"id":123456789}` value in the response - this is your chat ID

## MongoDB User Schema

Your MongoDB collection should have users with the following structure:

```json
{
  "_id": {"$oid": "67c348a804e365fa3d283b97"},
  "telegram_chat_id": "123456789",
  "first_name": "John",
  "last_name": "Doe",
  "timezone": "America/New_York",
  "plaid_access_token": "access-sandbox-xxxxxxxx",
  "settings": {
    "timezone": "America/New_York",
    "financial_weekly_summary": true,
    "financial_weekly_summary_time": "08:00",
    "stock_weekly_summary": true,
    "stock_weekly_summary_time": "09:00"
  }
}
```

## Timezone and Time Handling

The system respects each user's timezone when determining when to send notifications:

1. The scheduler runs every minute and checks for users who should receive notifications
2. The current time is rounded to the nearest minute to ensure precision:
   - If seconds are less than 30, it rounds down to the current minute
   - If seconds are 30 or more, it rounds up to the next minute
3. For each user with `financial_weekly_summary` enabled, it:
   - Converts the rounded UTC time to the user's local timezone
   - Compares the user's local time with their configured notification time
   - If they match, the user receives a notification

This ensures that users receive notifications at their preferred local time, regardless of where they are located, and that notifications are sent at the exact minute specified, not a few seconds before or after.

## Adding a Test User

You can add a test user to your database with:

```
python add_test_user.py
```

Make sure to edit the script first to include your actual Telegram chat ID.

## Usage

Run the scheduler:

```
python scheduler.py
```

The scheduler will run continuously, checking every minute for users who should receive notifications.

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