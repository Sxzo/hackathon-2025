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
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  },
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

### Refresh Token

```
POST /api/auth/refresh
```

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (refresh token)
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

### Logout (Revoke Token)

```
DELETE /api/auth/logout
```

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:
```json
{
  "message": "Successfully logged out"
}
```

### Logout from All Devices

```
DELETE /api/auth/logout-all
```

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:
```json
{
  "message": "Successfully logged out from all devices for +1234567890"
}
```

## JWT Authentication

This application uses JWT (JSON Web Tokens) for authentication:

1. When a user verifies their phone number, they receive access and refresh tokens
2. The tokens contain the user's phone number as the identity (subject)
3. For protected routes, include the access token in the Authorization header
4. The access token expires after 24 hours (configurable in .env)
5. The refresh token can be used to obtain a new access token
6. Tokens can be revoked (logout functionality)

## Using JWT in Your Application

To access protected routes:

1. Include the token in the Authorization header:
   ```
   Authorization: Bearer your-jwt-token
   ```

2. The server will:
   - Validate the token
   - Check if the token has been revoked
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

The project includes a comprehensive test suite organized in the `tests` directory:

```
tests/
├── __init__.py
├── README.md
└── jwt/
    ├── __init__.py
    ├── README.md
    ├── run_all_tests.py
    ├── run_protected_routes_tests.py
    ├── run_token_expiration_tests.py
    ├── test_protected_routes.py
    └── test_token_expiration.py
```

To run all tests:

```bash
python run_tests.py
```

To run only JWT tests:

```bash
python run_tests.py --jwt
```

For more details about the tests, see the [tests README](tests/README.md).

## Security Considerations

- Twilio Verify handles many security concerns like rate limiting and fraud prevention
- Use HTTPS in production to secure API requests and JWT tokens
- Never expose your Twilio credentials or SECRET_KEY in client-side code
- Set a reasonable expiration time for JWT tokens
- Use refresh tokens for long-lived sessions
- Implement token revocation (logout functionality)
- Store revoked tokens in a persistent store (e.g., Redis) in production 

## Plaid Integration

This application includes Plaid integration for accessing users' transaction history during signup. For detailed information about the Plaid integration, see [PLAID_INTEGRATION.md](PLAID_INTEGRATION.md).

### Testing the Plaid Integration

There are several ways to test the Plaid integration:

#### 1. Unit Tests

Run the unit tests for the Plaid integration:

```bash
pytest tests/test_plaid.py
```

These tests use mocks to simulate the Plaid API responses and verify that the endpoints work correctly.

#### 2. Integration Tests

Run the integration tests that simulate the entire flow from authentication to Plaid integration:

```bash
pytest tests/test_plaid_integration.py
```

These tests also use mocks but test the interaction between different parts of the application.

#### 3. Manual Testing Script

For manual testing with real Plaid API calls, use the provided script:

```bash
python tests/manual_plaid_test.py
```

This script provides a command-line interface to test the Plaid integration step by step:
- Send verification code
- Verify code and get tokens
- Create Plaid link token
- Exchange public token
- Get transactions
- Test signup with transactions flow

#### 4. Postman Collection

You can also use the Postman collection in the `postman` directory to test the API endpoints manually.

### Plaid Sandbox Testing

When testing in the Plaid sandbox environment, you can use these test credentials:
- Username: `user_good`
- Password: `pass_good`
- Any valid MFA code (e.g., `1234`)

For more test credentials, see: https://plaid.com/docs/sandbox/test-credentials/ 