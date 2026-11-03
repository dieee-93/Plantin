import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RootLayout } from '../RootLayout'

// Mock reverseGeocode
vi.mock('@/services/climate/geocodingClient', () => ({
  reverseGeocode: vi.fn().mockResolvedValue('La Matanza, Buenos Aires'),
}))

describe('RootLayout - Collapsible Sidebar HUD Navigation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('auto-collapses on space map route (/) by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<div>Página de Espacios</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    const sidebar = screen.getByTestId('app-sidebar')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveAttribute('data-collapsed', 'true')
    expect(sidebar).toHaveStyle({ width: '64px' })

    // Expand button is available
    const expandBtn = screen.getByRole('button', { name: /expandir menú lateral/i })
    expect(expandBtn).toBeInTheDocument()
  })

  it('allows user to expand and collapse the sidebar manually, persisting to localStorage', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<div>Página de Espacios</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    const sidebar = screen.getByTestId('app-sidebar')
    expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    // Click expand
    const expandBtn = screen.getByRole('button', { name: /expandir menú lateral/i })
    fireEvent.click(expandBtn)

    expect(sidebar).toHaveAttribute('data-collapsed', 'false')
    expect(sidebar).toHaveStyle({ width: '244px' })
    expect(screen.getByText('Plantin')).toBeInTheDocument()
    expect(screen.getByText('Flujo de Trabajo')).toBeInTheDocument()
    expect(localStorage.getItem('plantin_sidebar_collapsed')).toBe('false')

    // Click collapse
    const collapseBtn = screen.getByRole('button', { name: /colapsar menú lateral/i })
    fireEvent.click(collapseBtn)

    expect(sidebar).toHaveAttribute('data-collapsed', 'true')
    expect(sidebar).toHaveStyle({ width: '64px' })
    expect(localStorage.getItem('plantin_sidebar_collapsed')).toBe('true')
  })

  it('respects persisted localStorage preference when loaded', () => {
    localStorage.setItem('plantin_sidebar_collapsed', 'false')

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route path="dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    const sidebar = screen.getByTestId('app-sidebar')
    expect(sidebar).toHaveAttribute('data-collapsed', 'false')
    expect(sidebar).toHaveStyle({ width: '244px' })
  })

  it('renders icon navigation with accessible labels in collapsed mode', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<div>Mapa</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Verify nav links exist by accessible label
    expect(screen.getByRole('link', { name: 'Mapa de Espacios' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inventario y Especies' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plantas y Campo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lab. de Cruzas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resumen y Guía' })).toBeInTheDocument()

    // Compact location button in collapsed mode
    expect(screen.getByRole('button', { name: /configurar ubicación/i })).toBeInTheDocument()
  })
})
