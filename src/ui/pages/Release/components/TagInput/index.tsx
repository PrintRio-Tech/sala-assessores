import { useMemo, useState, type KeyboardEvent } from 'react'
import { Text } from '@print/ui'

import { useReleaseTags } from '@/application/modules/Release/hooks/use-release-tags'

import styles from './styles.module.scss'

type TagInputLayout = 'inline' | 'stacked'

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
  label?: string
  required?: boolean
  error?: string
  compact?: boolean
  hideHint?: boolean
  layout?: TagInputLayout
  scrollableChips?: boolean
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function TagInput({
  tags,
  onChange,
  disabled = false,
  label = 'Tags',
  required = false,
  error,
  compact = false,
  hideHint = false,
  layout = 'inline',
  scrollableChips = false,
}: TagInputProps) {
  const isStacked = layout === 'stacked'
  const [inputValue, setInputValue] = useState('')
  const { tags: suggestions, isLoading } = useReleaseTags(inputValue)

  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    if (!query) return []
    return suggestions
      .filter((tag) => !tags.some((item) => item.toLowerCase() === tag.toLowerCase()) && tag.toLowerCase().includes(query))
      .slice(0, 6)
  }, [inputValue, suggestions, tags])

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw)
    if (!tag) return
    const exists = tags.some((item) => item.toLowerCase() === tag.toLowerCase())
    if (exists) {
      setInputValue('')
      return
    }
    onChange([...tags, tag])
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((item) => item !== tag))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(inputValue)
    }
    if (event.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className={[styles.root, compact ? styles.rootCompact : ''].filter(Boolean).join(' ')} aria-required={required || undefined}>
      {label ? (
        <Text as="label" variant="labelSm" className={styles.label} htmlFor="tag-input">
          {label}
          {required ? <span className={styles.requiredIndicator} aria-hidden="true">*</span> : null}
        </Text>
      ) : null}

      <div className={styles.field}>
        {isStacked ? (
          <input
            id="tag-input"
            className={styles.inputStandalone}
            value={inputValue}
            disabled={disabled}
            placeholder="Digite e pressione Enter"
            aria-invalid={error ? true : undefined}
            aria-autocomplete="list"
            aria-controls="tag-suggestions"
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (inputValue.trim()) addTag(inputValue) }}
          />
        ) : (
          <div className={[styles.chips, compact ? styles.chipsCompact : ''].filter(Boolean).join(' ')} aria-label="Tags selecionadas">
            {tags.map((tag) => (
              <span key={tag} className={[styles.chip, compact ? styles.chipCompact : ''].filter(Boolean).join(' ')}>
                <Text as="span" variant="labelSm">{tag}</Text>
                <button type="button" className={styles.chipRemove} aria-label={`Remover tag ${tag}`} disabled={disabled} onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
            <input
              id="tag-input"
              className={styles.input}
              value={inputValue}
              disabled={disabled}
              placeholder={tags.length === 0 ? 'Digite e pressione Enter' : ''}
              aria-invalid={error ? true : undefined}
              aria-autocomplete="list"
              aria-controls="tag-suggestions"
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (inputValue.trim()) addTag(inputValue) }}
            />
          </div>
        )}

        {filteredSuggestions.length > 0 ? (
          <ul id="tag-suggestions" className={styles.suggestions} role="listbox" aria-label="Sugestões de tags">
            {filteredSuggestions.map((tag) => (
              <li key={tag} role="option">
                <button
                  type="button"
                  className={styles.suggestion}
                  disabled={disabled || isLoading}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {isStacked && tags.length > 0 ? (
        <div className={[styles.chipsExternal, scrollableChips ? styles.chipsExternalScroll : ''].filter(Boolean).join(' ')} aria-label="Tags selecionadas">
          {tags.map((tag) => (
            <span key={tag} className={[styles.chip, compact ? styles.chipCompact : ''].filter(Boolean).join(' ')}>
              <Text as="span" variant="labelSm">{tag}</Text>
              <button type="button" className={styles.chipRemove} aria-label={`Remover tag ${tag}`} disabled={disabled} onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
        </div>
      ) : null}

      {hideHint ? null : (
        <Text as="p" variant="labelSm" className={styles.hint}>
          Separe com Enter ou vírgula. Use tags para encontrar releases depois.
        </Text>
      )}

      {error ? (
        <Text as="p" variant="labelSm" tone="error" className={styles.error}>{error}</Text>
      ) : null}
    </div>
  )
}

