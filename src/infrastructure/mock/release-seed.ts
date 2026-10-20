import type { Release } from '@/domain/Release/release.entity'

export const mockReleases: Release[] = [
  {
    id: 'rel-q1',
    code: 'REL-001',
    title: 'Resultados do primeiro trimestre',
    subtitle: 'Desempenho operacional e expansão internacional',
    body: '<p>A companhia registra crescimento nas operações e abre o hub europeu.</p>',
    status: 'in_progress',
    tags: ['resultados', 'economia'],
    publishedAt: null,
    authorUserId: 'r-noel',
    authorName: 'Noel Ferreira',
    recipients: [],
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-12T12:00:00.000Z'),
  },
  {
    id: 'rel-esg',
    code: 'REL-002',
    title: 'Compromissos de sustentabilidade',
    subtitle: 'Metas climáticas e governança',
    body: '<h2>Agenda ESG</h2><p>O comunicado detalha as metas de redução e o cronograma de adequação.</p>',
    status: 'sent',
    tags: ['esg'],
    publishedAt: new Date('2026-08-01T12:00:00.000Z'),
    authorUserId: 'r-ana',
    authorName: 'Ana Paula',
    recipients: [{
      journalistId: 'j-carolina',
      addedAt: new Date('2026-08-01T12:00:00.000Z'),
      name: 'Carolina Montenegro',
      outletName: 'Valor Econômico',
    }],
    createdAt: new Date('2026-07-28T12:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
  },
]
