#!/bin/bash

# Test runner script for Money Manager application
# This script runs all tests and generates coverage reports

echo "🧪 Running Money Manager Tests..."

# Set environment variables for testing
export NODE_ENV=test

# Run tests with coverage
echo "📊 Running tests with coverage..."
npm run test:coverage

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    
    # Display coverage summary
    echo "📈 Coverage Summary:"
    if [ -f "coverage/money-manager/coverage-summary.json" ]; then
        cat coverage/money-manager/coverage-summary.json | jq '.total'
    fi
    
    echo "📁 Coverage report generated in: coverage/money-manager/index.html"
else
    echo "❌ Tests failed!"
    exit 1
fi 