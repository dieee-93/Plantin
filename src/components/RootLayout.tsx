import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { reverseGeocode } from '@/services/climate/geocodingClient'
import { LocationSetupModal } from '@/components/LocationSetupModal'
import {
  LayoutDashboard,
  Sprout,
  Users,
  FlaskConical,
  Map,
  GitBranch,
  Leaf,
  Package,
  MapPin,
  CloudRain,
  Snowflake,
  Sun,
} from 'lucide-react'

interface NavItem {
  to: string
  step?: string
  label: string
  sub?: string
  icon: React.ElementType
  end?: boolean
  matchPaths?: string[]
  children?: { to: string; label: string; icon: React.ElementType }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    step: '01',
    label: 'Mapa Isométrico',
    sub: 'Mis espacios y cultivo',
    icon: Map,
    matchPaths: ['/', '/locations'],
  },
  {
    to: '/accessions',
    step: '02',
    label: 'Inventario y Especies',
    sub: 'Semillas, variedades y catálogo',
    icon: Sprout,
    matchPaths: ['/accessions', '/seedlots', '/taxons'],
    children: [
      { to: '/accessions', label: 'Variedades / Material', icon: Sprout },
      { to: '/seedlots',   label: 'Sobres / Lotes',          icon: Package },
      { to: '/taxons',     label: 'Catálogo Botánico',       icon: Leaf },
    ],
  },
  {
    to: '/individuals',
    step: '03',
    label: 'Plantas y Campo',
    sub: 'Seguimiento y fenotipado',
    icon: Users,
    matchPaths: ['/individuals', '/phenotyping'],
    children: [
      { to: '/individuals', label: 'Plantas en Cultivo', icon: Users },
      { to: '/phenotyping', label: 'Cuaderno de Campo',  icon: FlaskConical },
    ],
  },
  {
    to: '/breeding',
    step: '04',
    label: 'Lab. de Cruzas',
    sub: 'Hibridación y pedigrí',
    icon: GitBranch,
  },
  {
    to: '/dashboard',
    label: 'Resumen y Guía',
    sub: 'Métricas del ciclo',
    icon: LayoutDashboard,
  },
]

export function RootLayout() {
  const location = useLocation()
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const {
    farmCoordinates,
    currentClimate,
    currentWeather,
    isLoadingClimate,
    climateError,
    setFarmCoordinates,
    loadClimateForCoordinates,
  } = useAgroClimateStore()

  useEffect(() => {
    if (farmCoordinates && (!currentClimate || !currentWeather) && !isLoadingClimate && !climateError) {
      loadClimateForCoordinates(farmCoordinates)
    }
  }, [farmCoordinates, currentClimate, currentWeather, isLoadingClimate, climateError, loadClimateForCoordinates])

  useEffect(() => {
    if (farmCoordinates && !farmCoordinates.name) {
      reverseGeocode(farmCoordinates.latitude, farmCoordinates.longitude).then((approxName) => {
        if (approxName) {
          setFarmCoordinates({ ...farmCoordinates, name: approxName })
        }
      })
    }
  }, [farmCoordinates, setFarmCoordinates])

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--surface-base)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <LocationSetupModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
      {/* ── Sidebar ── */}
      <nav
        style={{
          width: 244,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-elevated)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sprout size={14} color="white" strokeWidth={2} />
          </div>
          <div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                display: 'block',
                lineHeight: 1.1,
              }}
            >
              Plantin
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Germoplasma & Cultivo
            </span>
          </div>
        </div>

        {/* Nav group label */}
        <div style={{ padding: '16px 20px 8px' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Flujo de Trabajo
          </span>
        </div>

        {/* Links */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {NAV_ITEMS.map(({ to, step, label, sub, icon: Icon, end, matchPaths, children }) => {
            const isGroupActive = matchPaths
              ? matchPaths.some(p => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)))
              : end
                ? location.pathname === to
                : (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

            return (
              <div key={to}>
                <NavLink
                  to={to}
                  end={end}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 11px',
                      borderRadius: 'var(--radius-md)',
                      background: isGroupActive ? 'var(--accent-light)' : 'transparent',
                      color: isGroupActive ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: isGroupActive ? 600 : 450,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    <Icon
                      size={15}
                      strokeWidth={isGroupActive ? 2.1 : 1.75}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                        {step && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: isGroupActive ? 'white' : 'var(--surface-subtle)',
                              color: isGroupActive ? 'var(--accent)' : 'var(--text-tertiary)',
                            }}
                          >
                            {step}
                          </span>
                        )}
                      </div>
                      {sub && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: 10.5,
                            fontWeight: 400,
                            color: isGroupActive ? 'var(--accent)' : 'var(--text-tertiary)',
                            opacity: isGroupActive ? 0.85 : 0.9,
                            marginTop: 1,
                          }}
                        >
                          {sub}
                        </span>
                      )}
                    </div>
                  </div>
                </NavLink>

                {/* Sub-links when group is active */}
                {children && isGroupActive && (
                  <div
                    style={{
                      marginLeft: 20,
                      marginTop: 3,
                      marginBottom: 4,
                      paddingLeft: 10,
                      borderLeft: '1.5px solid #b7e4c7',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {children.map(child => {
                      const ChildIcon = child.icon
                      const isChildActive = location.pathname.startsWith(child.to)
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          style={{ textDecoration: 'none' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '5px 9px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 11.5,
                              fontWeight: isChildActive ? 600 : 400,
                              color: isChildActive ? 'var(--accent)' : 'var(--text-secondary)',
                              background: isChildActive ? 'var(--surface-subtle)' : 'transparent',
                            }}
                          >
                            <ChildIcon size={12} />
                            <span>{child.label}</span>
                          </div>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Widget Fijo de Ubicación y Clima en Sidebar */}
        <div
          style={{
            margin: '8px 10px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-tertiary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MapPin size={11} color="var(--accent)" />
              Ubicación Activa
            </span>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent)',
                cursor: 'pointer',
              }}
            >
              Cambiar
            </button>
          </div>

          {farmCoordinates ? (
            <>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={farmCoordinates.name || `${farmCoordinates.latitude.toFixed(2)}°, ${farmCoordinates.longitude.toFixed(2)}°`}
              >
                {farmCoordinates.name || `Coord. ${farmCoordinates.latitude.toFixed(2)}°, ${farmCoordinates.longitude.toFixed(2)}°`}
              </p>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 1 }}>
                {farmCoordinates.latitude.toFixed(2)}°, {farmCoordinates.longitude.toFixed(2)}°
              </p>

              {currentWeather && (
                <div
                  style={{
                    marginTop: 6,
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#78350f' }}>
                    <Sun size={11} color="#d97706" />
                    {currentWeather.temperature.toFixed(1)}°C
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#92400e',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={`${currentWeather.conditionLabel} · ${Math.round(currentWeather.humidity)}% HR`}
                  >
                    {currentWeather.conditionLabel} · {Math.round(currentWeather.humidity)}%
                  </span>
                </div>
              )}

              {currentClimate ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 5,
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <CloudRain size={10} color="#0284c7" />
                    {Math.round(currentClimate.annualRainfall)} mm/año
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Snowflake size={10} color="#38bdf8" />
                    {Math.round(currentClimate.annualFrostDays)} d. helada
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {isLoadingClimate ? 'Calculando clima...' : 'Clima pendiente'}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 11.5, color: '#b45309', fontWeight: 500 }}>
              Pendiente de configurar
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Plantin v0.2 · Flujo Unificado
          </p>
        </div>
      </nav>

      {/* ── Page content with animated transitions ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            style={{ flex: 1, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
