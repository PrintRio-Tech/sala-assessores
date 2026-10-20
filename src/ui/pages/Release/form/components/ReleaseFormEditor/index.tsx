import { useRef, type KeyboardEvent } from 'react'
import { RichTextEditor, Text, type RichTextEditorHandle } from '@print/ui'

import styles from './styles.module.scss'

type ReleaseFormEditorProps = {
  title: string
  subtitle: string
  body: string
  titleError?: string
  subtitleError?: string
  bodyError?: string
  disabled?: boolean
  onTitleChange: (title: string) => void
  onSubtitleChange: (subtitle: string) => void
  onBodyChange: (body: string) => void
}

function handleSingleLineEnter(event: KeyboardEvent<HTMLInputElement>, nextFocus?: () => void) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  nextFocus?.()
}

export function ReleaseFormEditor({
  title,
  subtitle,
  body,
  titleError,
  subtitleError,
  bodyError,
  disabled = false,
  onTitleChange,
  onSubtitleChange,
  onBodyChange,
}: ReleaseFormEditorProps) {
  const subtitleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<RichTextEditorHandle>(null)

  return (
    <section className={styles.card} aria-label="Conteúdo do release">
      <header className={styles.header}>
        <input
          className={styles.titleField}
          type="text"
          name="release-title"
          value={title}
          placeholder="Título do comunicado…"
          disabled={disabled}
          aria-label="Título do comunicado"
          aria-invalid={Boolean(titleError)}
          onChange={(event) => onTitleChange(event.target.value)}
          onKeyDown={(event) => handleSingleLineEnter(event, () => subtitleRef.current?.focus())}
        />
        {titleError ? <Text as="p" variant="labelSm" tone="error" className={styles.fieldError}>{titleError}</Text> : null}

        <input
          ref={subtitleRef}
          className={styles.subtitleField}
          type="text"
          name="release-subtitle"
          value={subtitle}
          placeholder="Linha de apoio ao título…"
          disabled={disabled}
          aria-label="Subtítulo do comunicado"
          aria-invalid={Boolean(subtitleError)}
          onChange={(event) => onSubtitleChange(event.target.value)}
          onKeyDown={(event) => handleSingleLineEnter(event, () => bodyRef.current?.focus())}
        />
        {subtitleError ? <Text as="p" variant="labelSm" tone="error" className={styles.fieldError}>{subtitleError}</Text> : null}
      </header>

      <div className={styles.body}>
        <RichTextEditor
          ref={bodyRef}
          value={body}
          onChange={onBodyChange}
          disabled={disabled}
          variant="panel"
          aria-label="Corpo do release"
        />
        {bodyError ? <Text as="p" variant="labelSm" tone="error">{bodyError}</Text> : null}
      </div>
    </section>
  )
}

type ReleaseFormEditorMobileProps = ReleaseFormEditorProps

export function ReleaseFormEditorMobile({
  title,
  subtitle,
  body,
  titleError,
  subtitleError,
  bodyError,
  disabled = false,
  onTitleChange,
  onSubtitleChange,
  onBodyChange,
}: ReleaseFormEditorMobileProps) {
  const subtitleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<RichTextEditorHandle>(null)

  return (
    <section className={styles.mobileCard} aria-label="Conteúdo do release">
      <input
        className={styles.titleField}
        type="text"
        name="release-title-mobile"
        value={title}
        placeholder="Título do comunicado…"
        disabled={disabled}
        aria-label="Título do comunicado"
        aria-invalid={Boolean(titleError)}
        onChange={(event) => onTitleChange(event.target.value)}
        onKeyDown={(event) => handleSingleLineEnter(event, () => subtitleRef.current?.focus())}
      />
      {titleError ? <Text as="p" variant="labelSm" tone="error" className={styles.fieldError}>{titleError}</Text> : null}

      <input
        ref={subtitleRef}
        className={styles.subtitleField}
        type="text"
        name="release-subtitle-mobile"
        value={subtitle}
        placeholder="Linha de apoio ao título…"
        disabled={disabled}
        aria-label="Subtítulo do comunicado"
        aria-invalid={Boolean(subtitleError)}
        onChange={(event) => onSubtitleChange(event.target.value)}
        onKeyDown={(event) => handleSingleLineEnter(event, () => bodyRef.current?.focus())}
      />
      {subtitleError ? <Text as="p" variant="labelSm" tone="error" className={styles.fieldError}>{subtitleError}</Text> : null}

      <RichTextEditor
        ref={bodyRef}
        value={body}
        onChange={onBodyChange}
        disabled={disabled}
        variant="embedded"
        aria-label="Corpo do release"
      />
      {bodyError ? <Text as="p" variant="labelSm" tone="error">{bodyError}</Text> : null}
    </section>
  )
}
