import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './router'
import { syncCoordinator } from '@/services/cloudSync'
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore'

// Suppress upstream @react-three/fiber deprecation warning for THREE.Clock
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')
  ) {
    return
  }
  originalWarn.apply(console, args)
}

// Auto-start reactive background cloud sync with Google Drive appDataFolder
syncCoordinator.startListening(useSpaceLayoutStore)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours default stale time
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
