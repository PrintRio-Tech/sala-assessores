import { useEffect, useState } from 'react'
import { AppShell, Avatar, Icon, ICONS, Text, type AppNavItem } from '@print/ui'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/ui/routes/paths'
import styles from './app-layout.module.scss'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const navItems: AppNavItem[] = [
    { id: 'home', label: 'Home', icon: <Icon src={ICONS.nav.home} size={20} />, active: location.pathname === '/', onClick: () => navigate(ROUTES.home) },
    { id: 'demandas', label: 'Demandas', icon: <Icon src={ICONS.nav.activities} size={20} />, active: location.pathname.startsWith('/demandas'), onClick: () => navigate(ROUTES.demands) },
    { id: 'jornalistas', label: 'Jornalistas', icon: <Icon src={ICONS.nav.journalists} size={20} />, active: location.pathname.startsWith('/jornalistas'), onClick: () => navigate(ROUTES.journalists) },
    { id: 'relatorios', label: 'Relatórios', icon: <Icon src={ICONS.nav.reports} size={20} />, active: location.pathname.startsWith('/relatorios'), onClick: () => navigate(ROUTES.reports) },
  ]

  return (
    <AppShell
      logo={<button className={styles.brand} type="button" onClick={() => navigate(ROUTES.home)}><span className={styles.brandMark}>S</span><span>Sala de Assessores</span></button>}
      logoCollapsed={<button className={styles.brandCollapsed} type="button" aria-label="Sala de Assessores" onClick={() => navigate(ROUTES.home)}>S</button>}
      mobileLogo={<Text as="span" variant="labelMd">Sala de Assessores</Text>}
      navItems={navItems}
      footerSlot={
        <div className={styles.footerUser}>
          <Avatar name="Noel Ferreira" size="sm" />
          <span className={styles.footerIdentity}>
            <Text as="strong" variant="labelSm">Noel Ferreira</Text>
            <Text as="small" variant="labelSm">Assessor de imprensa</Text>
          </span>
        </div>
      }
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      contentWidth="fluid"
      className={styles.withoutTopbar}
    ><Outlet /></AppShell>
  )
}
