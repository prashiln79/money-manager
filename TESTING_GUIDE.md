# Testing Guide

This document provides comprehensive information about the test suite implementation for the Money Manager application.

## Overview

The Money Manager application includes a comprehensive test suite covering all major components with a focus on CRUD operations (Create, Read, Update, Delete) and user interactions.

## Test Coverage

### Components Covered

1. **CategoryComponent** (`src/app/component/dashboard/category/category.component.spec.ts`)
   - Initialization and authentication
   - Category CRUD operations (Add, Edit, Delete)
   - Budget calculations and statistics
   - Transaction filtering and analysis
   - UI state management
   - Error handling

2. **AccountsComponent** (`src/app/component/dashboard/accounts/accounts.component.spec.ts`)
   - Account initialization and loading
   - Account CRUD operations (Add, Edit, Delete)
   - Loan and credit card calculations
   - Balance calculations and filtering
   - Date calculations for billing cycles
   - UI interactions and state management

3. **TransactionListComponent** (`src/app/component/dashboard/transaction-list/transaction-list.component.spec.ts`)
   - Transaction loading and initialization
   - Transaction CRUD operations (Add, Edit, Delete)
   - Import/Export functionality
   - Filtering and search capabilities
   - Bulk operations
   - Statistics and analytics

## Test Structure

### Test Organization

Each component test file follows this structure:

```typescript
describe('ComponentName', () => {
  // Setup and mocks
  beforeEach(() => {
    // Initialize mocks and test data
  });

  describe('Initialization', () => {
    // Component creation and initialization tests
  });

  describe('CRUD Operations - Add', () => {
    // Add operation tests
  });

  describe('CRUD Operations - Edit', () => {
    // Edit operation tests
  });

  describe('CRUD Operations - Delete', () => {
    // Delete operation tests
  });

  describe('Business Logic', () => {
    // Calculation and business logic tests
  });

  describe('Error Handling', () => {
    // Error scenarios and edge cases
  });
});
```

### Mock Data

Each test file includes comprehensive mock data:

```typescript
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Food',
    type: TransactionType.EXPENSE,
    icon: 'restaurant',
    color: '#FF5722',
    createdAt: Date.now(),
    budget: {
      hasBudget: true,
      budgetAmount: 500,
      budgetPeriod: 'monthly'
    }
  }
];
```

## Running Tests

### Local Development

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:ci

# Run tests with coverage
npm run test:coverage
```

### CI/CD Pipeline

Tests are automatically run during the build process:

```bash
# Build includes test execution
npm run build
```

### Test Scripts

- `npm test`: Development mode with watch
- `npm run test:ci`: Single run for CI/CD
- `npm run test:coverage`: Coverage report generation
- `./scripts/run-tests.sh`: Custom test runner script

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Exclusions

The following files are excluded from coverage:

- Test files (`*.spec.ts`)
- Mock files (`*.mock.ts`)
- Module files (`*.module.ts`)
- Environment files (`environments/**/*`)
- Polyfills and test setup files

## Test Best Practices

### 1. Mock Dependencies

Always mock external dependencies:

```typescript
const mockStore = jasmine.createSpyObj('Store', ['dispatch', 'select']);
const mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
```

### 2. Test CRUD Operations

Each component should have tests for:

```typescript
describe('CRUD Operations - Add', () => {
  it('should open add dialog', () => {
    // Test dialog opening
  });

  it('should handle successful creation', () => {
    // Test successful operation
  });

  it('should handle cancellation', () => {
    // Test user cancellation
  });
});
```

### 3. Test Error Scenarios

Include error handling tests:

```typescript
describe('Error Handling', () => {
  it('should handle authentication errors', () => {
    // Test auth failures
  });

  it('should handle API errors', () => {
    // Test service failures
  });
});
```

### 4. Test Business Logic

Test calculations and business rules:

```typescript
describe('Calculations', () => {
  it('should calculate budget progress correctly', () => {
    // Test budget calculations
  });

  it('should handle edge cases', () => {
    // Test boundary conditions
  });
});
```

## Continuous Integration

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/test.yml`) that:

1. Runs on push to main/develop branches
2. Runs on pull requests
3. Tests against multiple Node.js versions
4. Generates coverage reports
5. Uploads coverage to Codecov
6. Enforces coverage thresholds
7. Builds the application

### Build Integration

The build process automatically:

1. Runs all tests with coverage
2. Fails if coverage is below 80%
3. Fails if any tests fail
4. Proceeds with build only if tests pass

## Adding New Tests

### For New Components

1. Create test file: `component-name.component.spec.ts`
2. Follow the established test structure
3. Include CRUD operation tests
4. Test business logic and calculations
5. Include error handling scenarios
6. Ensure 80% coverage minimum

### For New Features

1. Add tests for new functionality
2. Update existing tests if needed
3. Ensure backward compatibility
4. Update mock data if required

## Troubleshooting

### Common Issues

1. **Mock Service Methods**: Ensure all service methods are mocked
2. **Async Operations**: Use `fakeAsync` and `tick()` for async tests
3. **Component Dependencies**: Mock all injected dependencies
4. **Store Actions**: Verify correct action dispatching

### Debugging Tests

```bash
# Run specific test file
npm test -- --include="**/category.component.spec.ts"

# Run with verbose output
npm test -- --verbose

# Run with source maps
npm test -- --source-map
```

## Performance Considerations

### Test Execution Time

- Keep individual tests under 100ms
- Use efficient mocking strategies
- Avoid unnecessary setup/teardown
- Group related tests in describe blocks

### Memory Usage

- Clean up subscriptions in `ngOnDestroy`
- Dispose of observables properly
- Avoid memory leaks in test setup

## Conclusion

This test suite ensures the reliability and maintainability of the Money Manager application. Regular test execution and coverage monitoring help maintain code quality and prevent regressions.

For questions or issues with the test suite, please refer to the Angular testing documentation or create an issue in the project repository. 