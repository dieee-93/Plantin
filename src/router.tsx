import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/RootLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AccessionsPage } from '@/features/accessions/AccessionsPage'
import { TaxonsPage } from '@/features/taxonomy/TaxonsPage'
import { IndividualsPage } from '@/features/individuals/IndividualsPage'
import { PhenotypingPage } from '@/features/phenotyping/PhenotypingPage'
import { LocationsPage } from '@/features/locations/LocationsPage'
import { BreedingPage } from '@/features/breeding/BreedingPage'
import { SeedLotsPage } from '@/features/seedLots/SeedLotsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'accessions', element: <AccessionsPage /> },
      { path: 'seedlots', element: <SeedLotsPage /> },
      { path: 'taxons', element: <TaxonsPage /> },
      { path: 'individuals', element: <IndividualsPage /> },
      { path: 'phenotyping', element: <PhenotypingPage /> },
      { path: 'breeding', element: <BreedingPage /> },
    ],
  },
])
