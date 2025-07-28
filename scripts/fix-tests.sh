#!/bin/bash

# Script to fix common test issues
echo "🔧 Fixing common test issues..."

# Create a backup of the current test setup
echo "📦 Creating backup of current test files..."
mkdir -p test-backup/$(date +%Y%m%d_%H%M%S)

# Find all test files and create a list of issues
echo "🔍 Analyzing test files..."
find src -name "*.spec.ts" -type f > test-files.txt

echo "📋 Found $(wc -l < test-files.txt) test files"

# Common fixes to apply
echo "🛠️  Applying common fixes..."

# 1. Fix standalone component imports
echo "  - Fixing standalone component imports..."
find src -name "*.spec.ts" -exec sed -i '' 's/imports: \[\([^]]*\)\]/imports: [\1, ...TEST_IMPORTS]/g' {} \;

# 2. Add missing providers
echo "  - Adding missing providers..."
find src -name "*.spec.ts" -exec sed -i '' 's/providers: \[/providers: [...TestSetup.getCommonProviders(), /g' {} \;

# 3. Fix TestBed.configureTestingModule calls
echo "  - Fixing TestBed.configureTestingModule calls..."
find src -name "*.spec.ts" -exec sed -i '' 's/TestBed.configureTestingModule({/TestSetup.configureTestingModule(/g' {} \;

echo "✅ Common fixes applied!"
echo ""
echo "📝 Next steps:"
echo "1. Review the changes made to test files"
echo "2. Run specific test files to check for remaining issues"
echo "3. Fix any remaining specific issues manually"
echo ""
echo "To run tests for a specific component:"
echo "  npm test -- --include='**/component-name.component.spec.ts'"
echo ""
echo "To run all tests:"
echo "  npm run test:pre-commit" 