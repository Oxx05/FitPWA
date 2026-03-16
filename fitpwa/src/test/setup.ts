import '@testing-library/jest-dom'

// Mock global APIs if needed
// Example: Mocking navigator.onLine if it breaks tests
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  value: true,
})
