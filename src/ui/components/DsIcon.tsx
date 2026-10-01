import { Icon as PrintUiIcon, type IconProps } from '@print/ui'

import { withAssetBase } from '@/shared/with-asset-base'

export type { IconProps }

export function Icon({ src, ...props }: IconProps) {
  return <PrintUiIcon src={withAssetBase(src)} {...props} />
}
