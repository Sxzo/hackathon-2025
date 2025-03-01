#!/usr/bin/env python
"""
Script to run JWT protected routes tests.
"""
import unittest
import sys
import os

# Add the parent directory to the path so we can import the test modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from tests.jwt.test_protected_routes import JWTProtectedRoutesTest

if __name__ == '__main__':
    print("\n===== Testing JWT Protected Routes =====\n")
    
    # Create a test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(JWTProtectedRoutesTest)
    
    # Run the tests
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    
    # Print summary
    if result.wasSuccessful():
        print("\n✅ All JWT protected routes tests passed successfully!")
    else:
        print("\n❌ Some JWT protected routes tests failed!")
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
                
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1) 