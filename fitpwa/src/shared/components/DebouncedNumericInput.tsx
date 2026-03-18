import React, { useState, useEffect } from 'react'

interface DebouncedNumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null
  onChange: (value: number | null) => void
  debounceTime?: number
}

export function DebouncedNumericInput({
  value,
  onChange,
  debounceTime = 500,
  className,
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
        if (value !== null) onChange(null)
        return
      }
      const numericValue = parseFloat(localValue)
      if (!isNaN(numericValue) && numericValue !== value) {
        onChange(numericValue)
      }
    }, debounceTime)

    return () => clearTimeout(handler)
  }, [localValue, debounceTime, onChange, value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow empty, numbers, and a single decimal point/hyphen for temporary state
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setLocalValue(val)
    }
  }

  const handleBlur = () => {
    if (localValue === '') {
      onChange(null)
    } else {
      const numericValue = parseFloat(localValue)
      if (!isNaN(numericValue) && numericValue !== value) {
        onChange(numericValue)
      } else if (isNaN(numericValue)) {
        setLocalValue(value === null ? '' : value.toString())
      }
    }
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  )
}
