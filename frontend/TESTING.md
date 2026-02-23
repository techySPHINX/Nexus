# Frontend Testing Guide - Nexus

Your frontend testing setup is now complete with Vitest, React Testing Library, and example test files.

## Quick Start

### Run Tests
```bash
npm test                  # Run tests in watch mode
npm test -- --run        # Run tests once
npm run test:ui          # Open interactive UI
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch for changes
```

## Test File Structure

All tests should be placed in `src/__tests__/` or co-located with components as `ComponentName.test.tsx`.

## Testing Patterns

### 1. Component Tests

**File**: `src/components/MyComponent.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    render(<MyComponent />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });
});
```

### 2. Hook Tests

**File**: `src/__tests__/useMyHook.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useMyHook from '../hooks/useMyHook';

describe('useMyHook', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue(newValue);
    });
    
    expect(result.current.value).toBe(newValue);
  });
});
```

### 3. Utility Function Tests

**File**: `src/__tests__/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '../utils/myUtils';

describe('myUtilFunction', () => {
  it('performs calculation correctly', () => {
    expect(myUtilFunction(5)).toBe(10);
  });

  it('handles edge cases', () => {
    expect(myUtilFunction(0)).toBe(0);
  });
});
```

### 4. API/Service Tests

**File**: `src/__tests__/apiService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUser } from '../services/api';

global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user data', async () => {
    const mockData = { id: 1, name: 'John' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData,
    });

    const result = await fetchUser(1);
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
  });
});
```

## Common Assertions

```typescript
// Existence
expect(element).toBeInTheDocument();
expect(element).toBeVisible();

// Text content
expect(screen.getByText(/pattern/i)).toBeInTheDocument();
expect(element).toHaveTextContent('exact text');

// Attributes
expect(button).toBeDisabled();
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();

// Classes
expect(element).toHaveClass('active');

// Function calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledOnce();
```

## User Interaction

```typescript
import userEvent from '@testing-library/user-event';

// Create user event instance (recommended)
const user = userEvent.setup();

// Click
await user.click(element);

// Type
await user.type(input, 'text');

// Select
await user.selectOptions(select, 'option-value');

// Hover
await user.hover(element);

// Keyboard
await user.keyboard('{Enter}');
```

## Mocking

### Mock Functions
```typescript
const mockFn = vi.fn();
const mockFn = vi.fn(() => 'return value');
const mockFn = vi.fn().mockResolvedValue(data);
const mockFn = vi.fn().mockRejectedValue(error);
```

### Mock Modules
```typescript
vi.mock('./myModule', () => ({
  functionName: vi.fn(),
}));
```

### Clear Mocks
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Best Practices

1. **Test Behavior, Not Implementation** - Focus on what users see and do
2. **Use User Events** - Prefer `userEvent` over `fireEvent`
3. **Query Preference Order**:
   - `getByRole()` - Most accessible
   - `getByLabelText()` - For form inputs
   - `getByPlaceholderText()` - For inputs with placeholders
   - `getByText()` - For other elements
   - `getByTestId()` - Last resort

4. **Act Wrapper** - Use `act()` for state updates in hooks
5. **Cleanup** - Tests auto-cleanup via setupTests.ts
6. **Mock External APIs** - Always mock fetch, axios, etc.
7. **Descriptive Names** - Use clear test descriptions

## Example Tests Provided

- ✅ `Button.test.tsx` - Component testing with user interactions
- ✅ `utils.test.ts` - Utility function testing
- ✅ `hooks.test.ts` - Custom hook testing with state
- ✅ `api.test.ts` - API service mocking

## Coverage Reports

Generate and view coverage:
```bash
npm run test:coverage
```

Coverage HTML report will be in `coverage/` directory.

## Troubleshooting

**Tests not found?** - Ensure files match pattern `**/*.test.{ts,tsx}` or `**/*.spec.{ts,tsx}`

**Module not found?** - Check vitest.config.ts alias configuration

**DOM node errors?** - Verify setupTests.ts is properly configured

**Async issues?** - Wrap state updates in `act()` and await async operations

---

For more info: https://vitest.dev/ and https://testing-library.com/
