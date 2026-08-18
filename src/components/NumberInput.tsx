interface NumberInputProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  currency?: boolean
}

export function NumberInput({ id, label, value, onChange, currency = false }: NumberInputProps) {
  return (
    <label className="number-field" htmlFor={id}>
      <span className="number-field__label">{label}</span>
      <span className="number-field__control">
        {currency ? <span className="number-field__prefix">RM</span> : null}
        <input
          id={id}
          type="number"
          inputMode={currency ? 'decimal' : 'numeric'}
          min="0"
          step={currency ? '0.01' : '1'}
          placeholder="0"
          value={value === 0 ? '' : value}
          onChange={(event) => {
            const parsed = Number(event.target.value)
            const nextValue = Number.isFinite(parsed) && parsed >= 0
              ? currency
                ? Math.round(parsed * 100) / 100
                : Math.floor(parsed)
              : 0
            onChange(nextValue)
          }}
        />
      </span>
    </label>
  )
}
