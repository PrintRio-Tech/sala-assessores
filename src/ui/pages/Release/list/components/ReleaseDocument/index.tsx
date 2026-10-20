import { RichTextViewer, Text } from '@print/ui'

import type { Release } from '@/application/modules/Release/hooks/use-releases'
import tagInputStyles from '@/ui/pages/Release/components/TagInput/styles.module.scss'
import { formatReleaseCardDate, formatReleaseDateTime } from '../../constants'

import styles from './styles.module.scss'

function formatRecipientChip(recipient: Release['recipients'][number]) {
  const name = recipient.name?.trim() || recipient.journalistId
  const outlet = recipient.outletName?.trim()
  return outlet ? `${name} — ${outlet}` : name
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type ReleaseDocumentProps = {
  release: Release
  authorName?: string
}

export function ReleaseDocument({ release, authorName }: ReleaseDocumentProps) {
  const publishedLabel = release.publishedAt
    ? `Publicado em ${formatReleaseCardDate(release.publishedAt)}`
    : `Atualizado em ${formatReleaseDateTime(release.updatedAt)}`

  return (
    <article className={styles.document}>
      <header className={styles.header}>
        <Text as="p" variant="labelSm" tone="muted" className={styles.meta}>{publishedLabel}</Text>
        <h2 className={styles.title}>{release.title}</h2>
        <p className={styles.subtitle}>{release.subtitle}</p>
        {authorName ? (
          <div className={styles.byline}>
            <span className={styles.avatar} aria-hidden="true">{getInitials(authorName)}</span>
            <div className={styles.author}>
              <Text as="p" variant="labelSm" className={styles.authorName}>{authorName}</Text>
            </div>
          </div>
        ) : null}
      </header>

      <section className={styles.recipients} aria-label="Enviado para">
        <Text as="p" variant="labelSm" tone="muted" className={styles.recipientsLabel}>Enviado para</Text>
        {release.recipients.length === 0 ? (
          <Text as="p" variant="bodyMd" tone="muted">Nenhum destinatário.</Text>
        ) : (
          <div className={tagInputStyles.chipsExternal}>
            {release.recipients.map((recipient) => (
              <span key={recipient.journalistId} className={tagInputStyles.chip}>
                <Text as="span" variant="labelSm">{formatRecipientChip(recipient)}</Text>
              </span>
            ))}
          </div>
        )}
      </section>

      <RichTextViewer content={release.body} className={styles.body} />
    </article>
  )
}
