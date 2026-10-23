import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/RootLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AccessionsPage } from '@/features/accessions/AccessionsPage'
import { TaxonsPage } from '@/features/taxonomy/TaxonsPage'
import { IndividualsPage } from '@/features/individuals/IndividualsPage'
import { PhenotypingPage } from '@/features/phenotyping/PhenotypingPage'
import { BreedingPage } from '@/features/breeding/BreedingPage'
import { SeedLotsPage } from '@/features/seedLots/SeedLotsPage'

const LocationsPage = lazy(() =>
  import('@/features/locations/LocationsPage').then(m => ({ default: m.LocationsPage }))
)

const PageFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, color: 'var(--text-tertiary)' }}>
    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>Cargando vista isométrica...</span>
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'locations',
        element: (
          <Suspense fallback={<PageFallback />}>
            <LocationsPage />
          </Suspense>
        ),
      },
      { path: 'accessions', element: <AccessionsPage /> },
      { path: 'seedlots', element: <SeedLotsPage /> },
      { path: 'taxons', element: <TaxonsPage /> },
      { path: 'individuals', element: <IndividualsPage /> },
      { path: 'phenotyping', element: <PhenotypingPage /> },
      { path: 'breeding', element: <BreedingPage /> },
    ],
  },
])

