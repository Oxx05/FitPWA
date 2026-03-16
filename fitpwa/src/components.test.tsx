import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './shared/components/Button'
import { Input } from './shared/components/Input'

describe('Shared UI Components', () => {
  describe('Button', () => {
    it('should render correctly and handle clicks', () => {
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Test</Button>)
      fireEvent.click(screen.getByText('Test'))
      expect(onClick).toHaveBeenCalled()
    })

    it('should show loading state', () => {
      render(<Button isLoading>Test</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Input', () => {
    it('should handle value changes', () => {
      const onChange = vi.fn()
      render(<Input placeholder="Enter text" onChange={onChange} />)
      const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'hello' } })
      expect(onChange).toHaveBeenCalled()
      expect(input.value).toBe('hello')
    })

    it('should display error message', () => {
      render(<Input error="Field required" />)
      expect(screen.getByText('Field required')).toBeDefined()
    })
  })
})
