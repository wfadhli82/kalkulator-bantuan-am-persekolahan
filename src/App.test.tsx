import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => cleanup())

  it('guides the user through the four calculator steps', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Prototaip Kalkulator Bantuan Am Persekolahan' })).toBeInTheDocument()
    expect(screen.getByText('Memudahkan pengiraan unjuran pelajar dan peruntukan')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tetapkan laporan' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /seterusnya/i }))
    expect(screen.getByRole('heading', { name: 'Masukkan bilangan pelajar' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /seterusnya/i }))
    expect(screen.getByRole('heading', { name: 'Semak kadar bantuan' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /seterusnya/i }))
    expect(screen.getByRole('heading', { name: 'Keputusan unjuran' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /muat turun laporan excel/i })).toBeInTheDocument()
  })

  it('labels the reset action and keeps data when reset is cancelled', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn(() => false))
    render(<App />)

    const yearSelect = screen.getByRole('combobox', { name: /tahun permohonan/i })
    await user.selectOptions(yearSelect, '2030')

    const resetButton = screen.getByRole('button', { name: 'Reset Data' })
    expect(resetButton).toHaveAttribute('title', 'Reset Data')
    await user.click(resetButton)

    expect(window.confirm).toHaveBeenCalledOnce()
    expect(yearSelect).toHaveValue('2030')
  })
})
