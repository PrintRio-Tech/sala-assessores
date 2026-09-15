import { useEffect, useState } from 'react'
import { AppShell, Avatar, BrandLogo, Icon, ICONS, Text, type AppNavItem } from '@print/ui'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { currentUser } from '@/application/current-user'
import { useSession } from '@/application/modules/Auth/hooks/use-session'
import { ROUTES } from '@/ui/routes/paths'
import styles from './app-layout.module.scss'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { session, logout } = useSession()
  const displayName = session?.email || currentUser.name

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login)
  }

  const navItems: AppNavItem[] = [
    { id: 'home', label: 'Home', icon: <Icon src={ICONS.nav.home} size={20} />, active: location.pathname === '/', onClick: () => navigate(ROUTES.home) },
    { id: 'demandas', label: 'Demandas', icon: <Icon src={ICONS.nav.activities} size={20} />, active: location.pathname.startsWith('/demandas'), onClick: () => navigate(ROUTES.demands) },
    { id: 'jornalistas', label: 'Jornalistas', icon: <Icon src={ICONS.nav.journalists} size={20} />, active: location.pathname.startsWith('/jornalistas'), onClick: () => navigate(ROUTES.journalists) },
    { id: 'relatorios', label: 'Relatórios', icon: <Icon src={ICONS.nav.reports} size={20} />, active: location.pathname.startsWith('/relatorios'), onClick: () => navigate(ROUTES.reports) },
  ]

  return (
    <AppShell
      logo={
        <button className={styles.brandHome} type="button" onClick={() => navigate(ROUTES.home)}>
          <BrandLogo variant="sidebarExpanded" />
        </button>
      }
      logoCollapsed={
        <button className={styles.brandHome} type="button" aria-label="Print" onClick={() => navigate(ROUTES.home)}>
          <BrandLogo variant="sidebarCollapsed" />
        </button>
      }
      mobileLogo={
        <img
          className={styles.mobileHeaderLogo}
          src={`${import.meta.env.BASE_URL}logos/wordmark-chumbo.png`}
          alt="Print"
          width={120}
          height={32}
          loading="eager"
          decoding="async"
          translate="no"
        />
      }
      navItems={navItems}
      footerSlot={
        <div className={styles.footerWrapper}>
          <div className={styles.footerUser}>
            <Avatar name={displayName} size="sm" />
            <span className={styles.footerIdentity}>
              <Text as="strong" variant="labelSm">{displayName}</Text>
              <Text as="small" variant="labelSm">Assessor de imprensa</Text>
            </span>
          </div>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} title="Sair" aria-label="Sair">
            Sair
          </button>
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
