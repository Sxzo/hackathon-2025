# JWT Protected Routes Tests

This directory contains tests for the JWT token authentication and protected routes.

## Test Files

- `test_protected_routes.py`: Tests for protected routes with valid, invalid, and missing tokens
- `test_token_expiration.py`: Tests for token expiration functionality
- `run_protected_routes_tests.py`: Script to run the protected routes tests
- `run_token_expiration_tests.py`: Script to run the token expiration test
- `run_all_tests.py`: Script to run all JWT tests

## Running the Tests

### Running All Tests

To run all JWT tests:

```bash
python -m tests.jwt.run_all_tests
```

### Running Specific Tests

To run only the protected routes tests:

```bash
python -m tests.jwt.run_protected_routes_tests
```

To run only the token expiration test:

```bash
python -m tests.jwt.run_token_expiration_tests
```

## Test Coverage

The tests cover the following functionality:

1. **Protected Routes**:
   - Accessing protected routes with a valid token
   - Accessing protected routes without a token
   - Accessing protected routes with an invalid token

2. **Token Refresh**:
   - Refreshing an access token with a valid refresh token

3. **Token Revocation (Logout)**:
   - Revoking a token (logout)
   - Verifying that a revoked token cannot be used

4. **Token Expiration**:
   - Verifying that tokens expire after the configured time

## Expected Results

When all tests pass, you should see output similar to:

```
===== Running All JWT Tests =====

test_protected_route_with_valid_token (tests.jwt.test_protected_routes.JWTProtectedRoutesTest) ... ok
test_protected_route_without_token (tests.jwt.test_protected_routes.JWTProtectedRoutesTest) ... ok
test_protected_route_with_invalid_token (tests.jwt.test_protected_routes.JWTProtectedRoutesTest) ... ok
test_refresh_token_endpoint (tests.jwt.test_protected_routes.JWTProtectedRoutesTest) ... ok
test_logout_endpoint (tests.jwt.test_protected_routes.JWTProtectedRoutesTest) ... ok
test_logout_all_endpoint (tests.jwt.test_protected_routes.JWTProtectedRoutesTest) ... ok
test_token_expiration (tests.jwt.test_token_expiration.JWTTokenExpirationTest) ... ok

===== JWT Tests Summary =====
Total tests run: 7

✅ All JWT tests passed successfully!
```

If any tests fail, the script will provide details about the failures. 