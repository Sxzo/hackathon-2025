# SMS Authentication with Twilio Verify and JWT

This Flask application demonstrates how to implement SMS-based authentication using Twilio Verify with JWT (JSON Web Tokens) for secure authentication.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file based on `.env.example` and fill in your Twilio credentials:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your actual credentials.

4. Run the application:
   ```
   python run.py
   ```

## Twilio Verify Setup

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the Twilio Console
3. Create a Verify Service in the [Twilio Verify Console](https://www.twilio.com/console/verify/services)
4. Copy the Verify Service SID
5. Add these credentials to your `.env` file

## What is Twilio Verify?

Twilio Verify is a service that handles phone verification via SMS, voice, email, or push notifications. It provides:

- Pre-built templates for verification messages
- Automatic rate limiting and fraud prevention
- Global carrier coverage
- Analytics and reporting
- Multiple verification channels (SMS, voice, email, push)

## API Endpoints

### Send Verification Code

```
POST /api/auth/send-verification
```

Request body:
```json
{
  "phone_number": "+1234567890"
}
```

Response:
```json
{
  "message": "Verification code sent successfully",
  "status": "pending"
}
```

### Verify Code

```
POST /api/auth/verify-code
```

Request body:
```json
{
  "phone_number": "+1234567890",
  "code": "123456"
}
```

Response (success):
```json
{
  "message": "Verification successful",
  "authenticated": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "phone_number": "+1234567890"
}
```

Response (failure):
```json
{
  "message": "Invalid verification code",
  "authenticated": false,
  "status": "pending"
}
```

### Protected Route Example

```
GET /api/auth/protected
```

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:
```json
{
  "message": "This is a protected route",
  "phone_number": "+1234567890"
}
```

## JWT Authentication

This application uses JWT (JSON Web Tokens) for authentication:

1. When a user verifies their phone number, they receive a JWT token
2. The token contains the user's phone number as the identity (subject)
3. For protected routes, include the token in the Authorization header
4. The token expires after 24 hours (configurable in .env)

## Using JWT in Your Application

To access protected routes:

1. Include the token in the Authorization header:
   ```
   Authorization: Bearer your-jwt-token
   ```

2. The server will:
   - Validate the token
   - Extract the phone number
   - Allow access to the protected resource

## Testing

### Manual Testing

You can manually test the authentication flow using the provided test script:

```
python test_auth.py
```

This script will:
1. Prompt you to enter your phone number
2. Send a verification code to your phone via Twilio Verify
3. Prompt you to enter the code you received
4. Verify the code and generate a JWT token
5. Decode and display the token contents
6. Test accessing a protected route with the token

### Automated Testing

For automated testing (e.g., in CI/CD pipelines), use the pytest-based tests:

```
pytest test_auth_automated.py -v
```

These tests use mocking to simulate Twilio Verify responses, so they don't require actual SMS messages to be sent.

## Security Considerations

- Twilio Verify handles many security concerns like rate limiting and fraud prevention
- Use HTTPS in production to secure API requests and JWT tokens
- Never expose your Twilio credentials or SECRET_KEY in client-side code
- Set a reasonable expiration time for JWT tokens
- Consider implementing token refresh functionality for long-lived sessions 