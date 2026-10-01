import { ICONS } from '@print/ui'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withAssetBase } from '@/shared/with-asset-base'
import { Icon } from './DsIcon'

describe('DsIcon', () => {
  it('prefixa o src dos ICONS do DS com o BASE da app', () => {
    const { container } = render(<Icon src={ICONS.nav.home} size={20} />)
    const mark = container.firstElementChild as HTMLElement

    expect(mark.style.webkitMaskImage).toBe(`url("${withAssetBase(ICONS.nav.home)}")`)
  })
})
