# Testing Guide for VistAI

This document outlines the testing strategy, current test coverage, and guidelines for writing tests in the VistAI project.

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Current Test Coverage](#current-test-coverage)
- [Testing Strategy](#testing-strategy)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage Goals](#test-coverage-goals)
- [Continuous Integration](#continuous-integration)

## Testing Philosophy

VistAI follows a pragmatic testing approach focused on:

1. **Confidence over Coverage**: Tests should provide confidence in deployments
2. **User-Centric Testing**: Test what users actually do, not implementation details
3. **Fast Feedback**: Tests should run quickly to enable rapid development
4. **Maintainable Tests**: Tests should be easy to understand and maintain
5. **Integration Focus**: Emphasize integration tests over unit tests where possible

### Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\    - Critical user flows
 /      \   - Deployment validation
/__________\ Integration Tests (Some)
           - API endpoints
           - Component interactions
           - Database operations
           
           Unit Tests (Many)
           - Utility functions
           - Business logic
           - Edge cases
```

## Current Test Coverage

### Existing Tests (7 files)

| Test File | Type | Coverage | Description |
|-----------|------|----------|-------------|
| `utils.test.ts` | Unit | Utility functions | Time formatting, model name extraction |
| `auth.test.ts` | Integration | Authentication | JWT signing, user registration/login |
| `worker.test.ts` | Unit | Worker utilities | Title/snippet extraction, error handling |
| `query-endpoints.test.ts` | Integration | API endpoints | Search and analytics endpoints |
| `model-selection.test.ts` | Unit | Model logic | Model selection and fallback behavior |
| `search-stream.test.ts` | Integration | Streaming | Server-Sent Events functionality |
| `track-click.test.ts` | Integration | Analytics | Click tracking and statistics |

### Coverage Analysis

**Current Coverage**: ~40% of critical functionality

**Well Tested**:
- ✅ Basic utility functions
- ✅ Authentication flow
- ✅ API endpoint responses
- ✅ Database operations

**Missing Coverage**:
- ❌ Frontend components (0% coverage)
- ❌ Error handling edge cases
- ❌ Real-time streaming edge cases
- ❌ User interaction flows
- ❌ Performance and load testing

## Testing Strategy

### 1. **Unit Tests**

Focus on pure functions and business logic:

```typescript
// Good unit test example
test('formatSearchTime formats milliseconds to seconds', () => {
  assert.strictEqual(formatSearchTime(1234), '1.23');
  assert.strictEqual(formatSearchTime(1000), '1.00');
  assert.strictEqual(formatSearchTime(0), '0.00');
});
```

**What to unit test**:
- Utility functions (`lib/utils.ts`)
- Data transformation functions
- Validation logic
- Error parsing functions
- Business rule implementations

### 2. **Integration Tests**

Test component interactions and API contracts:

```typescript
// Good integration test example
test('authentication tokens are signed', async () => {
  const db = new FakeD1Database()
  const env = { DB: db, OPENROUTER_API_KEY: 'k', JWT_SECRET: 'secret' }

  const regReq = new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'u', password: 'p' }),
  })
  
  const regRes = await worker.fetch(regReq, env)
  const reg = await regRes.json()
  
  // Verify JWT structure and signature
  const [h, b, s] = reg.token.split('.')
  const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(`${h}.${b}`).digest('base64url')
  assert.strictEqual(s, expected)
});
```

**What to integration test**:
- API endpoint workflows
- Database transactions
- Authentication flows
- Search result processing
- External API interactions

### 3. **End-to-End Tests**

Test complete user workflows (currently missing):

```typescript
// E2E test example (to be implemented)
test('complete search workflow', async () => {
  // 1. User lands on home page
  // 2. User enters search query
  // 3. User sees streaming results
  // 4. User clicks on a result
  // 5. Result is tracked in analytics
});
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm ci

# Ensure test environment is set up
npm run check  # TypeScript validation
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/utils.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests in watch mode (if available)
npm test -- --watch
```

### Test Environment Setup

Tests use a fake D1 database implementation for isolation:

```typescript
// tests/fake-db.js
export class FakeD1Database {
  constructor() {
    this.tables = new Map();
  }
  
  prepare(sql) {
    // Mock D1 database implementation
    return new FakePreparedStatement(sql, this.tables);
  }
}
```

## Writing Tests

### Test File Organization

```
tests/
├── fake-db.js           # Mock database for testing
├── utils.test.ts        # Utility function tests
├── auth.test.ts         # Authentication tests
├── worker.test.ts       # Worker endpoint tests
├── integration/         # Integration test suites
│   ├── search-flow.test.ts
│   └── analytics.test.ts
└── e2e/                 # End-to-end tests (future)
    └── user-flows.test.ts
```

### Writing Unit Tests

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { functionToTest } from '../src/module.js';

test('descriptive test name', () => {
  // Arrange
  const input = 'test input';
  const expected = 'expected output';
  
  // Act
  const result = functionToTest(input);
  
  // Assert
  assert.strictEqual(result, expected);
});

test('error handling', () => {
  assert.throws(() => {
    functionToTest(null);
  }, /Expected error message/);
});
```

### Writing Integration Tests

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/worker.js';
import { FakeD1Database } from './fake-db.js';

test('API endpoint integration', async () => {
  // Arrange
  const db = new FakeD1Database();
  const env = { DB: db, OPENROUTER_API_KEY: 'test-key' };
  
  const request = new Request('http://localhost/api/endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'test' })
  });
  
  // Act
  const response = await worker.fetch(request, env);
  const result = await response.json();
  
  // Assert
  assert.strictEqual(response.status, 200);
  assert.ok(result.success);
});
```

### Testing Async Operations

```typescript
test('async operation with timeout', async () => {
  const startTime = Date.now();
  
  await functionWithTimeout(100);
  
  const duration = Date.now() - startTime;
  assert.ok(duration >= 100, 'Should take at least 100ms');
  assert.ok(duration < 200, 'Should not take more than 200ms');
});
```

### Testing Error Conditions

```typescript
test('handles network errors gracefully', async () => {
  // Mock network failure
  const failingFetch = () => Promise.reject(new Error('Network error'));
  
  const result = await searchWithRetry('query', { fetch: failingFetch });
  
  assert.strictEqual(result.error, true);
  assert.match(result.message, /Network error/);
});
```

## Test Coverage Goals

### Short-term Goals (Next Sprint)

1. **Add Frontend Component Tests** (Priority: High)
   ```typescript
   // Example: SearchBar component test
   test('SearchBar submits query on enter', () => {
     render(<SearchBar onSearch={mockSearch} />);
     fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test query' } });
     fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
     expect(mockSearch).toHaveBeenCalledWith('test query');
   });
   ```

2. **Error Handling Coverage** (Priority: High)
   - Test all error boundary scenarios
   - Test API failure responses
   - Test invalid input handling

3. **Stream Processing Tests** (Priority: Medium)
   - Test Server-Sent Events edge cases
   - Test connection interruptions
   - Test malformed event data

### Medium-term Goals (Next Month)

1. **Performance Tests**
   ```typescript
   test('search response time under load', async () => {
     const startTime = performance.now();
     const promises = Array(10).fill(0).map(() => searchAI('test query'));
     await Promise.all(promises);
     const duration = performance.now() - startTime;
     assert.ok(duration < 5000, 'Should handle 10 concurrent searches in under 5s');
   });
   ```

2. **End-to-End User Flows**
   - Complete search workflow
   - User registration and login
   - Settings management
   - Analytics viewing

3. **Security Testing**
   - Authentication bypass attempts
   - SQL injection protection
   - XSS prevention
   - Rate limiting validation

### Long-term Goals (Next Quarter)

1. **Load Testing**
   - Database performance under load
   - Worker memory usage
   - Concurrent user simulation

2. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast validation

3. **Browser Compatibility**
   - Cross-browser testing
   - Mobile device testing
   - Progressive enhancement validation

## Continuous Integration

### Current CI Setup

Tests are run using Node.js built-in test runner:

```bash
# In CI pipeline
npm ci
npm run check  # TypeScript validation
npm test      # Run all tests
```

### Recommended CI Enhancements

1. **Test Coverage Reporting**
   ```yaml
   # .github/workflows/test.yml
   - name: Generate coverage report
     run: npm test -- --coverage
   - name: Upload coverage
     uses: codecov/codecov-action@v3
   ```

2. **Parallel Test Execution**
   ```yaml
   strategy:
     matrix:
       test-group: [unit, integration, e2e]
   ```

3. **Performance Regression Detection**
   ```yaml
   - name: Performance benchmark
     run: npm run bench
   - name: Compare with baseline
     run: npm run bench:compare
   ```

## Testing Best Practices

### Do's ✅

1. **Write descriptive test names**
   ```typescript
   // Good
   test('returns error when API key is missing')
   
   // Bad
   test('API key test')
   ```

2. **Test behavior, not implementation**
   ```typescript
   // Good - tests user behavior
   test('user can search and see results')
   
   // Bad - tests internal state
   test('search state is updated correctly')
   ```

3. **Use realistic test data**
   ```typescript
   const testUser = {
     username: 'testuser123',
     password: 'SecurePassword123!'
   };
   ```

4. **Clean up after tests**
   ```typescript
   test('example test', async () => {
     const db = new FakeD1Database();
     try {
       // Test logic
     } finally {
       await db.cleanup();
     }
   });
   ```

### Don'ts ❌

1. **Don't test external services directly**
   ```typescript
   // Bad - depends on external service
   test('OpenRouter API returns results')
   
   // Good - mock external dependency
   test('handles OpenRouter API response correctly')
   ```

2. **Don't write overly complex tests**
   ```typescript
   // Bad - too many concerns in one test
   test('complete application workflow with edge cases')
   
   // Good - focused, single-purpose tests
   test('user can submit search query')
   test('search results display correctly')
   test('error handling works for failed searches')
   ```

3. **Don't ignore flaky tests**
   ```typescript
   // Bad - ignoring timing issues
   test.skip('sometimes fails due to timing')
   
   // Good - fix or improve the test
   test('handles async operations reliably', async () => {
     await waitFor(() => expect(element).toBeInTheDocument());
   });
   ```

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/users.js
export const testUsers = {
  validUser: {
    username: 'testuser',
    password: 'ValidPassword123!'
  },
  adminUser: {
    username: 'admin',
    password: 'AdminPassword123!'
  }
};

// tests/fixtures/search-results.js
export const mockSearchResults = [
  {
    id: 1,
    modelId: 'openai/gpt-4o-mini',
    content: 'Mock AI response content...',
    responseTime: 1250
  }
];
```

### Database Seeding

```typescript
async function seedTestDatabase(db) {
  await db.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
    .bind('testuser', hashPassword('password'))
    .run();
    
  await db.prepare('INSERT INTO searches (query) VALUES (?)')
    .bind('test query')
    .run();
}
```

## Debugging Tests

### Common Issues

1. **Async Test Failures**
   ```typescript
   // Problem: Not awaiting async operations
   test('async test', async () => {
     const result = fetchData(); // Missing await
     assert.ok(result);
   });
   
   // Solution: Proper async handling
   test('async test', async () => {
     const result = await fetchData();
     assert.ok(result);
   });
   ```

2. **Database State Pollution**
   ```typescript
   // Problem: Tests affecting each other
   test('first test', () => {
     db.insert('data');
     // Test logic
   });
   
   test('second test', () => {
     // Sees data from first test
   });
   
   // Solution: Test isolation
   beforeEach(() => {
     db.reset();
   });
   ```

### Test Debugging Tools

```typescript
// Add debug logging
import debug from 'debug';
const log = debug('test:search');

test('debug example', () => {
  log('Starting test with input:', input);
  const result = functionUnderTest(input);
  log('Result:', result);
  assert.ok(result);
});
```

---

**Last Updated**: January 2025  
**Test Coverage Target**: 80% by Q2 2025  
**Next Review**: February 2025