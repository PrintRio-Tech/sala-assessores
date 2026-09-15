import { useEffect, useState } from 'react'
import { AppShell, Avatar, BrandLogo, Icon, ICONS, Text, type AppNavItem } from '@print/ui'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { mockAuthService } from '@/application/services/mock-auth-service'
import { ROUTES } from '@/ui/routes/paths'
import styles from './app-layout.module.scss'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const session = mockAuthService.getSession()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleLogout = () => {
    mockAuthService.logout()
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
          src="/logos/wordmark-chumbo.png"
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
            <Avatar name={session?.email || 'Usuário'} size="sm" />
            <span className={styles.footerIdentity}>
              <Text as="strong" variant="labelSm">{session?.email || 'Usuário'}</Text>
              <Text as="small" variant="labelSm">Assessor de imprensa</Text>
            </span>
          </div>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} title="Sair">
            <Icon src={ICONS.actions.logout} size={16} />
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
