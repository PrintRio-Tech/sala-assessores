import { describe, expect, it, vi } from 'vitest'

import type { DemandRepository } from '../demand.repository'
import { InvalidExternalInteractionError } from '../errors/demand.errors'
import { RegisterExternalInteraction } from './register-external-interaction.use-case'

function repository(): DemandRepository {
  return {
    list: vi.fn(),
    getById: vi.fn(),
    registerInteraction: vi.fn().mockResolvedValue({ id: 'd-1' }),
    savePositioning: vi.fn(),
    registerOutcome: vi.fn(),
  }
}

describe('RegisterExternalInteraction', () => {
  it('registra Aguardando retorno somente com resultado e data/hora, sem fallback silencioso', async () => {
    const repo = repository()
    const useCase = new RegisterExternalInteraction(repo)
    const occurredAt = new Date('2026-08-25T14:30:00.000Z')

    await useCase.execute('d-1', {
      occurredAt,
      result: 'waiting_response',
      recordedBy: 'Noel Ferreira',
    })

    expect(repo.registerInteraction).toHaveBeenCalledWith('d-1', {
      occurredAt,
      type: null,
      result: 'waiting_response',
      participants: null,
      summary: null,
      nextStep: null,
      channel: null,
      recipient: null,
      body: null,
      recordedBy: 'Noel Ferreira',
      origin: 'off_platform',
    })
  })

  it('mantém a autoria do registro separada dos participantes externos', async () => {
    const repo = repository()
    const useCase = new RegisterExternalInteraction(repo)

    await useCase.execute('d-1', {
      occurredAt: new Date('2026-08-25T14:30:00.000Z'),
      result: 'waiting_response',
      participants: 'Maria Clara; Redação',
      recordedBy: '  Noel Ferreira  ',
    })

    expect(repo.registerInteraction).toHaveBeenCalledWith('d-1', expect.objectContaining({
      recordedBy: 'Noel Ferreira',
      participants: 'Maria Clara; Redação',
    }))
  })

  it('normaliza campos aplicáveis e descarta os ocultos segundo a regra do resultado', async () => {
    const repo = repository()
    const useCase = new RegisterExternalInteraction(repo)
    await useCase.execute('d-1', {
      occurredAt: new Date('2026-08-25T14:30:00.000Z'),
      result: 'waiting_response',
      type: 'phone',
      participants: '  Ana  ',
      summary: '  Caso concluído.  ',
      nextStep: '  Não se aplica.  ',
    })

    expect(repo.registerInteraction).toHaveBeenCalledWith('d-1', expect.objectContaining({
      type: 'phone',
      participants: 'Ana',
      summary: 'Caso concluído.',
      nextStep: 'Não se aplica.',
    }))
  })

  it.each([
    ['information_missing', 'participants', 'Informe com quem ou qual área.'],
    ['information_missing', 'summary', 'Informe o que faltou ou o que pediram.'],
    ['information_missing', 'nextStep', 'Informe o próximo passo ou encaminhamento.'],
    ['declined', 'participants', 'Informe os participantes ou a área envolvida.'],
    ['declined', 'summary', 'Informe o motivo da recusa.'],
    ['forwarded', 'participants', 'Informe para quem ou qual área.'],
    ['forwarded', 'summary', 'Informe o que foi encaminhado.'],
    ['forwarded', 'nextStep', 'Informe o próximo passo ou encaminhamento.'],
    ['other', 'type', 'Informe o tipo de interação.'],
    ['other', 'participants', 'Informe os participantes ou a área envolvida.'],
    ['other', 'summary', 'Registre um resumo factual da interação.'],
    ['approved', 'participants', 'Informe quem aprovou ou a área.'],
    ['approved', 'summary', 'Informe o parecer.'],
    ['response_sent', 'channel', 'Informe o canal.'],
    ['response_sent', 'recipient', 'Informe o destinatário.'],
    ['response_sent', 'body', 'Informe o texto enviado.'],
    ['closed_without_send', 'summary', 'Informe o motivo do encerramento.'],
  ] as const)('valida %s.%s pela matriz única', async (result, field, message) => {
    const useCase = new RegisterExternalInteraction(repository())
    const input = {
      occurredAt: new Date('2026-08-25T14:30:00.000Z'),
      result,
      type: 'email' as const,
      participants: 'Redação',
      summary: 'Informação registrada.',
      nextStep: 'Responder até 17h.',
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Texto enviado.',
      [field]: field === 'type' ? null : '   ',
    }

    await expect(useCase.execute('d-1', input)).rejects.toEqual(new InvalidExternalInteractionError(message))
  })

  it.each(['waiting_response', 'declined'] as const)('aceita campos opcionais ausentes para %s', async (result) => {
    const repo = repository()
    const useCase = new RegisterExternalInteraction(repo)

    await useCase.execute('d-1', {
      occurredAt: new Date('2026-08-25T14:30:00.000Z'),
      result,
      ...(result === 'declined' ? { participants: 'Redação', summary: 'Sem disponibilidade.' } : {}),
    })

    expect(repo.registerInteraction).toHaveBeenCalledWith('d-1', expect.objectContaining({
      type: null,
      nextStep: null,
    }))
  })

  it.each([
    [undefined, 'Informe o resultado da interação.'],
    ['unknown', 'Resultado da interação inválido.'],
  ])('rejeita resultado %s', async (result, message) => {
    const useCase = new RegisterExternalInteraction(repository())
    const input = {
      occurredAt: new Date('2026-08-25T14:30:00.000Z'),
      type: 'email' as const,
      result,
      participants: 'Redação',
      summary: 'Pedido reiterado por e-mail.',
      nextStep: 'Responder até 17h.',
    }

    await expect(useCase.execute('d-1', input as never)).rejects.toEqual(
      new InvalidExternalInteractionError(message),
    )
  })

  it('grava canal, destinatário e texto na resposta enviada, sem versão', async () => {
    const repo = repository()
    const useCase = new RegisterExternalInteraction(repo)
    const occurredAt = new Date('2026-08-25T16:00:00.000Z')

    await useCase.execute('d-1', {
      occurredAt,
      result: 'response_sent',
      type: 'email',
      channel: '  E-mail  ',
      recipient: '  redacao@exemplo.com  ',
      body: '  Nota enviada à redação.  ',
      nextStep: 'Não deve persistir.',
    })

    expect(repo.registerInteraction).toHaveBeenCalledWith('d-1', {
      occurredAt,
      type: null,
      result: 'response_sent',
      participants: null,
      summary: null,
      nextStep: null,
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Nota enviada à redação.',
      recordedBy: 'Autoria não informada',
      origin: 'off_platform',
    })
  })

  it('grava o motivo do encerramento sem resposta', async () => {
    const repo = repository()
    const useCase = new RegisterExternalInteraction(repo)

    await useCase.execute('d-1', {
      occurredAt: new Date('2026-08-25T16:00:00.000Z'),
      result: 'closed_without_send',
      summary: '  Pauta perdeu atualidade.  ',
    })

    expect(repo.registerInteraction).toHaveBeenCalledWith('d-1', expect.objectContaining({
      result: 'closed_without_send',
      summary: 'Pauta perdeu atualidade.',
      channel: null,
      recipient: null,
      body: null,
      nextStep: null,
      origin: 'off_platform',
    }))
  })
})
