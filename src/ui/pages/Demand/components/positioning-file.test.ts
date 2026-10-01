import { describe, expect, it } from 'vitest'

import { PositioningAttachmentTooLargeError } from '@/application/modules/Demand/demand-types'
import { fileToAttachment } from './positioning-file'

describe('fileToAttachment', () => {
  it('não persiste chave local/ nem usa blob como objectKey', () => {
    const file = new File(['nota'], 'nota.pdf', { type: 'application/pdf' })
    const attachment = fileToAttachment(file)

    expect(attachment.objectKey).toBeUndefined()
    expect(attachment.objectUrl.startsWith('blob:')).toBe(true)
    expect(attachment.filename).toBe('nota.pdf')
  })

  it('recusa anexo acima de 20MB', () => {
    const file = new File(['x'], 'grande.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 + 1 })
    expect(() => fileToAttachment(file)).toThrow(PositioningAttachmentTooLargeError)
  })
})
