# Edge Regression Tests

These tests are intentionally strict and can fail on current code.

Use them to answer, for each file/feature:

1. What can break?
2. What are edge cases?
3. What does the user depend on?
4. What must never fail?

## Principle

When these tests fail, fix production code (components/services/contexts), not the tests, unless requirements change.

## Run

```bash
npm run test:edge
```
