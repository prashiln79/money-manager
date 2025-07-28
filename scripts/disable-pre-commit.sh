#!/bin/bash

# Script to temporarily disable pre-commit hooks
echo "Temporarily disabling pre-commit hooks..."

# Rename the pre-commit hook to disable it
if [ -f ".husky/pre-commit" ]; then
    mv .husky/pre-commit .husky/pre-commit.disabled
    echo "✅ Pre-commit hook disabled (renamed to .husky/pre-commit.disabled)"
else
    echo "❌ Pre-commit hook not found"
fi

echo ""
echo "To re-enable pre-commit hooks later, run:"
echo "  mv .husky/pre-commit.disabled .husky/pre-commit"
echo ""
echo "Note: This allows commits without running tests. Use with caution!" 