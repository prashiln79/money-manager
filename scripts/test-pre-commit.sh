#!/bin/bash

# Script to manually test the pre-commit hook
echo "Testing pre-commit hook..."

# Run the pre-commit hook
.husky/pre-commit

echo "Pre-commit hook test completed!" 