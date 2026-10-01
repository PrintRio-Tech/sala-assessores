import { useEffect, useLayoutEffect, useState } from 'react'
import { AppShell, Avatar, ICONS, Text, type AppNavItem } from '@print/ui'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useSession } from '@/application/modules/Auth/hooks/use-session'
import { withAssetBase } from '@/shared/with-asset-base'
import { Icon } from '@/ui/components/DsIcon'
import { ROUTES } from '@/ui/routes/paths'
import { prefixAppShellChromeMasks } from './prefix-appshell-chrome-masks'
import styles from './app-layout.module.scss'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { session } = useSession()
  const displayName = session?.name || session?.email || ''

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useLayoutEffect(() => {
    prefixAppShellChromeMasks(document)
  }, [collapsed])

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
          <img
            className={`${styles.brandLogo} ${styles.brandLogoExpanded}`}
            src={withAssetBase('/logos/wordmark-light-tagline.png')}
            alt="Print — Consultoria Estratégica em Comunicação"
            width={148}
            height={40}
            loading="eager"
            decoding="async"
            translate="no"
          />
        </button>
      }
      logoCollapsed={
        <button className={styles.brandHome} type="button" aria-label="Print" onClick={() => navigate(ROUTES.home)}>
          <img
            className={`${styles.brandLogo} ${styles.brandLogoCollapsed}`}
            src={withAssetBase('/logos/icon.png')}
            alt="Print"
            width={40}
            height={40}
            loading="eager"
            decoding="async"
            translate="no"
          />
        </button>
      }
      mobileLogo={
        <img
          className={styles.mobileHeaderLogo}
          src={withAssetBase('/logos/wordmark-chumbo.png')}
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
        <div className={styles.footerUser}>
          <Avatar name={displayName || ' '} size="sm" />
          <span className={styles.footerIdentity}>
            {displayName ? <Text as="strong" variant="labelSm">{displayName}</Text> : null}
            {session ? <Text as="small" variant="labelSm">Assessor de imprensa</Text> : null}
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
