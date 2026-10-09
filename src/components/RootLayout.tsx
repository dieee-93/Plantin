import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  Sprout,
  Users,
  FlaskConical,
  Map,
  GitBranch,
  Leaf,
  Package,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/accessions',  label: 'Accesiones',      icon: Sprout },
  { to: '/individuals', label: 'Individuos',       icon: Users },
  { to: '/taxons',      label: 'Taxonomía',        icon: Leaf },
  { to: '/phenotyping', label: 'Fenotipado',       icon: FlaskConical },
  { to: '/locations',   label: 'Ubicaciones',      icon: Map },
  { to: '/seedlots',    label: 'Lotes de Semillas', icon: Package },
  { to: '/breeding',    label: 'Mejoramiento',     icon: GitBranch },
]

export function RootLayout() {
  const location = useLocation()

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
      {/* ── Sidebar ── */}
      <nav
        style={{
          width: 220,
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
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Plantin
          </span>
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
            Módulos
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
            gap: 2,
          }}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent-light)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                  className={!isActive ? 'hover-nav-item' : ''}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)'
                      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={isActive ? 2 : 1.75}
                    style={{ flexShrink: 0 }}
                  />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
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
            Plantin v0.1
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
