import type { Demand } from '@/domain/Demand/demand.entity'
import type { DemandListItem } from './use-demands'
import {
  useLocalDemandStore,
  type LocalDemandCapture,
  type NewLocalDemandCapture,
} from '../stores/local-demand.store'

type CaptureOptions = { onSuccess?: (record: LocalDemandCapture) => void }
type RemoveOptions = { onSuccess?: () => void }

function isLocalCapture(source: DemandListItem | LocalDemandCapture | Demand): source is LocalDemandCapture {
  return 'pressRequest' in source && 'subject' in source
}

export function useLocalDemandActions() {
  const add = useLocalDemandStore((state) => state.add)
  const adopt = useLocalDemandStore((state) => state.adopt)
  const updateCapture = useLocalDemandStore((state) => state.updateCapture)
  const removeRecord = useLocalDemandStore((state) => state.remove)
  const linkJournalistRecord = useLocalDemandStore((state) => state.linkJournalist)

  return {
    capture(input: NewLocalDemandCapture, options: CaptureOptions = {}) {
      const record = add(input)
      options.onSuccess?.(record)
      return record
    },
    revise(source: DemandListItem | LocalDemandCapture | Demand, input: NewLocalDemandCapture) {
      const local = isLocalCapture(source) ? source : adopt(source)
      return updateCapture(local.id, input)
    },
    remove(id: string, options: RemoveOptions = {}) {
      removeRecord(id)
      options.onSuccess?.()
    },
    linkJournalist(id: string, input: { journalistId: string; journalistName: string; outletName: string }) {
      return linkJournalistRecord(id, input)
    },
  }
}
