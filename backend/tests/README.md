# Tests

This directory contains tests for the backend application.

## Test Categories

- [JWT Tests](jwt/README.md): Tests for JWT token authentication and protected routes

## Running Tests

### Running All Tests

To run all tests:

```bash
python -m unittest discover -s tests
```

### Running Specific Test Categories

To run tests for a specific category, see the README in the respective directory:

- [JWT Tests](jwt/README.md)

## Adding New Tests

When adding new tests:

1. Create a new directory under `tests/` for the test category if it doesn't exist
2. Add an `__init__.py` file to make it a proper Python package
3. Create test files with names starting with `test_`
4. Create runner scripts if needed
5. Update the README files 