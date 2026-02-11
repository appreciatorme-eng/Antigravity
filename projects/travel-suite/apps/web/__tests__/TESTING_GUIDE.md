# Jest Testing Guide for Travel Suite Web App

This guide covers setup and best practices for testing the GoBuddy Adventures web application.

## Setup

### 1. Install Dependencies
```bash
cd apps/web
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @types/jest \
  ts-jest \
  jest-environment-jsdom
```

### 2. Configuration Files Already Created
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test setup and mocks
- `__tests__/` - Test directory

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (re-run on file changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

Generates coverage report in `coverage/` directory.

### Debug Mode
```bash
npm run test:debug
# Then open chrome://inspect in Chrome
```

## Test Organization

```
__tests__/
├── lib/
│   └── utils.test.ts          # Utility function tests
├── api/
│   └── api.test.ts            # API utilities tests
├── components/
│   ├── TripCard.test.tsx       # Component unit tests
│   └── ItineraryMap.test.tsx
├── pages/
│   ├── planner.test.tsx        # Page tests
│   └── trips.test.tsx
└── TESTING_GUIDE.md            # This file
```

## Writing Tests

### Basic Test Structure
```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = processInput(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### Testing API Routes
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/itinerary/generate/route'

describe('/api/itinerary/generate', () => {
  it('should generate itinerary', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a 3-day itinerary for Paris',
        days: 3,
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('destination')
  })
})
```

### Testing React Components
```typescript
import { render, screen } from '@testing-library/react'
import { TripCard } from '@/components/TripCard'

describe('TripCard Component', () => {
  it('should render trip information', () => {
    const trip = {
      id: '1',
      title: 'Paris Trip',
      destination: 'Paris',
    }

    render(<TripCard trip={trip} />)

    expect(screen.getByText('Paris Trip')).toBeInTheDocument()
    expect(screen.getByText('Paris')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const onClick = jest.fn()
    const trip = { id: '1', title: 'Trip', destination: 'Paris' }

    render(<TripCard trip={trip} onClick={onClick} />)
    screen.getByRole('button').click()

    expect(onClick).toHaveBeenCalled()
  })
})
```

### Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react'
import { useTrips } from '@/lib/hooks/useTrips'

describe('useTrips Hook', () => {
  it('should load trips', async () => {
    const { result } = renderHook(() => useTrips())

    expect(result.current.loading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current.trips).toBeInstanceOf(Array)
  })
})
```

## Common Assertions

```typescript
// Value checks
expect(value).toBe(5)
expect(value).toEqual({})
expect(value).not.toBe(5)

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Strings
expect(text).toContain('substring')
expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain('item')

// Objects
expect(obj).toHaveProperty('key')
expect(obj).toHaveProperty('key', 'value')

// DOM
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toHaveClass('active')
expect(element).toHaveValue('text')

// Async
expect(promise).resolves.toBe(value)
expect(promise).rejects.toThrow()

// Mocks
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(1)
```

## Mocking

### Mock Functions
```typescript
const mockFunction = jest.fn()
const mockWithReturnValue = jest.fn().mockReturnValue('result')
const mockAsync = jest.fn().mockResolvedValue({ data: 'result' })

// Check calls
expect(mockFunction).toHaveBeenCalled()
expect(mockFunction).toHaveBeenCalledWith('arg')
```

### Mock Modules
```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [] }),
    }),
  })),
}))
```

### Mock Next Router
Already configured in `jest.setup.js`

### Mock External APIs
```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
)
```

## Best Practices

### 1. Arrange-Act-Assert Pattern
```typescript
it('should update trip status', () => {
  // Arrange: Set up test data
  const trip = { id: '1', status: 'draft' }

  // Act: Perform action
  const updated = updateTripStatus(trip, 'confirmed')

  // Assert: Check result
  expect(updated.status).toBe('confirmed')
})
```

### 2. Test Behavior, Not Implementation
```typescript
// ✅ Good: Tests what user sees
expect(screen.getByText('Loading')).toBeInTheDocument()

// ❌ Bad: Tests internal state
expect(component.state.loading).toBe(true)
```

### 3. Use Semantic Queries
```typescript
// ✅ Good: User-centric
screen.getByRole('button', { name: 'Save Trip' })
screen.getByLabelText('Destination')
screen.getByText('Paris')

// ❌ Bad: Implementation-centric
screen.getByTestId('save-btn')
container.querySelector('.destination-input')
```

### 4. Test User Interactions
```typescript
import userEvent from '@testing-library/user-event'

it('should submit form', async () => {
  const user = userEvent.setup()
  render(<TripForm />)

  await user.type(screen.getByLabelText('Destination'), 'Paris')
  await user.click(screen.getByRole('button', { name: 'Generate' }))

  expect(await screen.findByText('Paris Itinerary')).toBeInTheDocument()
})
```

### 5. Clean Up After Tests
```typescript
afterEach(() => {
  jest.clearAllMocks()
})

// Or in individual tests
it('should do something', () => {
  const mockFn = jest.fn()
  // test...
  mockFn.mockRestore()
})
```

## Coverage Goals

### Target Coverage
```
├── Statements: 70%
├── Branches: 65%
├── Functions: 70%
└── Lines: 70%
```

### Check Coverage
```bash
npm run test:coverage
# View report
open coverage/lcov-report/index.html
```

### Improve Coverage
1. Run coverage report
2. Identify uncovered files
3. Add tests for critical paths
4. Focus on:
   - API utilities
   - Validation functions
   - Page logic
   - Error handling

## Testing Async Operations

### Promise-Based
```typescript
it('should fetch trips', async () => {
  const trips = await fetchTrips()
  expect(trips).toHaveLength(3)
})
```

### With waitFor
```typescript
import { waitFor } from '@testing-library/react'

it('should display trips after loading', async () => {
  render(<TripsList />)

  await waitFor(() => {
    expect(screen.getByText('Paris Trip')).toBeInTheDocument()
  })
})
```

### With Act
```typescript
import { act } from '@testing-library/react'

it('should update state', async () => {
  const { result } = renderHook(() => useState(0))

  act(() => {
    result.current[1](1)
  })

  expect(result.current[0]).toBe(1)
})
```

## Debugging Tests

### Console Logging
```typescript
it('should do something', () => {
  const element = screen.getByText('test')
  console.log(element) // Inspect element
  screen.debug() // Print DOM
})
```

### Debug Mode
```bash
npm run test:debug
# In Chrome: chrome://inspect
```

### Watch Mode
```bash
npm run test:watch
# Edit tests to see changes immediately
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Troubleshooting

### "Cannot find module" errors
- Check module aliases in `jest.config.js`
- Verify path exists
- Run `npm install`

### "ReferenceError: document is not defined"
- Set `testEnvironment: 'jest-environment-jsdom'` in jest.config.js
- Already configured ✓

### Async test timeout
- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Use `await waitFor()`

### Mock not working
- Ensure mock is before import
- Check jest.mock() placement
- Clear mocks between tests with `jest.clearAllMocks()`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [React Testing Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
