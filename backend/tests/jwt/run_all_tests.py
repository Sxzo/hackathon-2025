#!/usr/bin/env python
"""
Script to run all JWT tests.
"""
import unittest
import sys
import os

# Add the parent directory to the path so we can import the test modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from tests.jwt.test_protected_routes import JWTProtectedRoutesTest
from tests.jwt.test_token_expiration import JWTTokenExpirationTest

def main():
    """Run all JWT tests and return True if all tests pass, False otherwise."""
    print("\n===== Running All JWT Tests =====\n")
    
    # Create a test suite
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(JWTProtectedRoutesTest))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(JWTTokenExpirationTest))
    
    # Run the tests
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    
    # Print summary
    print("\n===== JWT Tests Summary =====")
    print(f"Total tests run: {result.testsRun}")
    
    if result.wasSuccessful():
        print("\n✅ All JWT tests passed successfully!")
    else:
        print("\n❌ Some JWT tests failed!")
        print(f"Failures: {len(result.failures)}")
        print(f"Errors: {len(result.errors)}")
        
        # Print details of failures and errors
        if result.failures:
            print("\nFailures:")
            for i, (test, traceback) in enumerate(result.failures, 1):
                print(f"\n--- Failure {i} ---")
                print(f"Test: {test}")
                print(f"Traceback: {traceback}")
        
        if result.errors:
            print("\nErrors:")
            for i, (test, traceback) in enumerate(result.errors, 1):
                print(f"\n--- Error {i} ---")
                print(f"Test: {test}")
                print(f"Traceback: {traceback}")
    
    return result.wasSuccessful()

if __name__ == '__main__':
    success = main()
    # Exit with appropriate code
    sys.exit(0 if success else 1) 