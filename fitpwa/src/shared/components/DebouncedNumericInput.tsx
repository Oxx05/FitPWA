import React, { useState, useEffect } from 'react'

interface DebouncedNumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null
  onChange: (value: number | null) => void
  debounceTime?: number
  defaultOnEmpty?: number | null // NEW PROP
}

export function DebouncedNumericInput({
  value,
  onChange,
  debounceTime = 500,
  defaultOnEmpty = 0,
  className,
  onFocus,
  onBlur,
  ...props
}: DebouncedNumericInputProps) {
  const [localValue, setLocalValue] = useState<string>(value === null ? '' : value.toString())

  useEffect(() => {
    // Update local value if parent value changes externally (and it's not what we currently have)
    const numericLocal = localValue === '' ? null : parseFloat(localValue)
    if (value !== numericLocal) {
       setLocalValue(value === null ? '' : value.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue === '') {
        if (value !== defaultOnEmpty) onChange(defaultOnEmpty)
        return
      }
      const numericValue = parseFloat(localValue)
      if (!isNaN(numericValue) && numericValue !== value) {
        onChange(numericValue)
      }
    }, debounceTime)

    return () => clearTimeout(handler)
  }, [localValue, debounceTime, onChange, value, defaultOnEmpty])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow empty, numbers, and a single decimal point/hyphen for temporary state
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setLocalValue(val)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (localValue === '0' || localValue === '0.0') {
      setLocalValue('')
    }
    if (onFocus) onFocus(e)
  }

  const handleBlurWrapper = (e: React.FocusEvent<HTMLInputElement>) => {
    if (localValue === '') {
      onChange(defaultOnEmpty)
      if (defaultOnEmpty !== null) {
        setLocalValue(defaultOnEmpty.toString())
      }
    } else {
      const numericValue = parseFloat(localValue)
      if (!isNaN(numericValue) && numericValue !== value) {
        onChange(numericValue)
      } else if (isNaN(numericValue)) {
        setLocalValue(value === null ? '' : value.toString())
      }
    }
    if (onBlur) onBlur(e)
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlurWrapper}
      className={className}
    />
  )
}
