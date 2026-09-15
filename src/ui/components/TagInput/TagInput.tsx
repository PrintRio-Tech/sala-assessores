import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { Badge, Text, TextInput } from '@print/ui'

import { normalizeTag } from '@/application/modules/Demand/presentation/demand-tags'

import styles from './TagInput.module.scss'

export type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  loading?: boolean
  disabled?: boolean
  label?: string
  name?: string
}

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  loading = false,
  disabled = false,
  label = 'Tags',
  name = 'tags',
}: TagInputProps) {
  const inputId = useId()
  const listboxId = useId()
  const [inputValue, setInputValue] = useState('')

  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    if (!query) return []

    return suggestions
      .filter((tag) => (
        !tags.some((item) => item.toLowerCase() === tag.toLowerCase())
        && tag.toLowerCase().includes(query)
      ))
      .slice(0, 6)
  }, [inputValue, suggestions, tags])

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw)
    if (!tag) return
    const exists = tags.some((item) => item.toLowerCase() === tag.toLowerCase())
    if (!exists) onChange([...tags, tag])
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
    <div className={styles.root}>
      <div className={styles.field}>
        <TextInput
          id={inputId}
          label={label}
          name={name}
          value={inputValue}
          disabled={disabled}
          placeholder="Digite e pressione Enter"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue)
          }}
        />
        {filteredSuggestions.length > 0 ? (
          <ul id={listboxId} className={styles.suggestions} role="listbox" aria-label="Sugestões de tags">
            {filteredSuggestions.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  className={styles.suggestion}
                  role="option"
                  disabled={disabled || loading}
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
      {tags.length > 0 ? (
        <div className={styles.chips} aria-label="Tags selecionadas">
          {tags.map((tag) => (
            <Badge key={tag} tone="secondary" size="sm" className={styles.chip}>
              <Text as="span" variant="labelSm">{tag}</Text>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Remover tag ${tag}`}
                disabled={disabled}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
