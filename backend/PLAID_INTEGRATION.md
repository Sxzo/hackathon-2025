# Plaid Integration Guide

This guide explains how to integrate Plaid with your application to access users' transaction history during signup.

## Setup

1. Sign up for a Plaid account at [https://plaid.com/](https://plaid.com/)
2. Obtain your Plaid API credentials (client ID and secret)
3. Update your `.env` file with your Plaid credentials:

```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox  # Use 'development' or 'production' for live environments
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US
```

## Understanding Token Types

This integration uses two different types of tokens that serve different purposes:

1. **JWT Tokens** - Used for authenticating with our backend API
   - Obtained after phone verification
   - Used in the `Authorization` header when making requests to our API
   - Should NEVER be sent to Plaid

2. **Plaid Tokens** - Used for interacting with Plaid's services
   - **Link Token** - Created by our backend and used by Plaid Link in the frontend
   - **Public Token** - Obtained from Plaid Link after user authentication
   - **Access Token** - Exchanged from a public token, used to access Plaid data
   - Managed by our backend, should never be exposed to the client (except for link tokens)

## Integration Flow

The Plaid integration follows this flow:

1. User completes phone verification and receives JWT tokens
2. Backend indicates Plaid is available (`plaid_enabled: true` in response)
3. Frontend requests a link token from our backend using JWT authentication
4. Backend creates and returns a Plaid link token
5. Frontend initiates Plaid Link with the link token
6. User selects their bank and authenticates
7. Plaid returns a public token to the frontend
8. Frontend sends the public token to our backend (with JWT authentication)
9. Backend exchanges the public token for a Plaid access token
10. Backend uses the Plaid access token to fetch transaction history

## API Endpoints

### 1. Create Link Token

```
POST /api/plaid/create-link-token
Authorization: Bearer <jwt_token>  # JWT token from authentication
```

Response:
```json
{
  "link_token": "link-sandbox-abc123...",
  "expiration": "2023-01-01T00:00:00Z"
}
```

### 2. Exchange Public Token (for authenticated users)

```
POST /api/plaid/exchange-public-token
Authorization: Bearer <jwt_token>  # JWT token from authentication
Content-Type: application/json

{
  "public_token": "public-sandbox-abc123..."  # Public token from Plaid Link
}
```

Response:
```json
{
  "access_token": "access-sandbox-abc123...",  # Plaid access token (not JWT)
  "item_id": "item-sandbox-abc123...",
  "message": "Public token exchanged successfully"
}
```

### 3. Get Transactions (for authenticated users)

```
GET /api/plaid/transactions?access_token=access-sandbox-abc123...  # Plaid access token
Authorization: Bearer <jwt_token>  # JWT token from authentication
```

Response:
```json
{
  "transactions": [...],
  "accounts": [...]
}
```

### 4. Signup with Transactions (during signup flow)

```
POST /api/plaid/signup-transactions
Content-Type: application/json

{
  "public_token": "public-sandbox-abc123...",  # Public token from Plaid Link
  "phone_number": "+1234567890"
}
```

Response:
```json
{
  "message": "Bank account linked successfully",
  "transactions": [...],
  "accounts": [...]
}
```

## Frontend Integration

To integrate Plaid Link in your frontend:

1. Install the Plaid Link library:
```
npm install react-plaid-link
```

2. Implement Plaid Link in your React component:

```jsx
import { usePlaidLink } from 'react-plaid-link';

function PlaidLinkButton({ onSuccess }) {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    // Fetch link token from your API using JWT authentication
    async function fetchLinkToken() {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${yourJwtToken}`,  // JWT token from authentication
        },
      });
      const data = await response.json();
      setLinkToken(data.link_token);  // This is a Plaid link token
    }
    fetchLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,  // Plaid link token
    onSuccess: (public_token, metadata) => {
      // Send public_token to your server
      onSuccess(public_token, metadata);
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Link Bank Account
    </button>
  );
}
```

3. Handle the success callback:

```jsx
function handlePlaidSuccess(publicToken, metadata) {
  // For authenticated users - use JWT token for API authentication
  fetch('/api/plaid/exchange-public-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourJwtToken}`,  // JWT token from authentication
    },
    body: JSON.stringify({ public_token: publicToken }),  // Public token from Plaid
  });

  // OR during signup
  fetch('/api/plaid/signup-transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_token: publicToken,  // Public token from Plaid
      phone_number: phoneNumber,
    }),
  });
}
```

## Security Considerations

1. Never store Plaid access tokens in client-side code or localStorage
2. Store access tokens securely in your database, associated with the user
3. Implement proper access controls to ensure users can only access their own data
4. Use HTTPS for all API requests
5. Follow Plaid's security best practices: https://plaid.com/docs/security/
6. Keep JWT tokens and Plaid tokens separate - they serve different purposes
7. Never send JWT tokens to Plaid or Plaid tokens to other third-party services

## Testing

In sandbox mode, you can use Plaid's test credentials:
- Username: `user_good`
- Password: `pass_good`
- Any valid MFA code (e.g., `1234`)

For more test credentials, see: https://plaid.com/docs/sandbox/test-credentials/ 