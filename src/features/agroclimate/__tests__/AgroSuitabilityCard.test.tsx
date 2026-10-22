import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgroSuitabilityCard } from '../AgroSuitabilityCard'
import { BUENOS_AIRES, TOMATO } from '@/domain/agroclimate/__tests__/fixtures'
import { assessCropSuitability } from '@/domain/agroclimate/suitabilityEngine'

describe('AgroSuitabilityCard', () => {
  it('renderiza la tarjeta de aptitud con score y meses óptimos cuando hay evaluación', () => {
    const assessment = assessCropSuitability(TOMATO, BUENOS_AIRES)

    render(
      <AgroSuitabilityCard
        assessment={assessment}
        climate={BUENOS_AIRES}
        onDetectLocation={vi.fn()}
      />,
    )

    expect(screen.getByText(/Aptitud Agroclimática/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Óptimo/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Campo abierto/i).length).toBeGreaterThan(0)
    // Los meses de siembra
    expect(screen.getByText('oct')).toBeInTheDocument()
    expect(screen.getByText('nov')).toBeInTheDocument()
    expect(screen.getByText('dic')).toBeInTheDocument()
  })

  it('muestra aviso si no hay ubicación configurada', () => {
    render(
      <AgroSuitabilityCard
        assessment={undefined}
        climate={undefined}
        onDetectLocation={vi.fn()}
      />,
    )

    expect(screen.getByText(/Sin ubicación geográfica/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Detectar mi ubicación/i })).toBeInTheDocument()
  })

  it('informa transparencia de incertidumbre si faltan datos ecofisiológicos', () => {
    const assessment = assessCropSuitability(undefined, BUENOS_AIRES)

    render(
      <AgroSuitabilityCard
        assessment={assessment}
        climate={BUENOS_AIRES}
        onDetectLocation={vi.fn()}
      />,
    )

    expect(screen.getAllByText(/Datos insuficientes/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Datos insuficientes para determinar aptitud/i)).toBeInTheDocument()
  })
})
