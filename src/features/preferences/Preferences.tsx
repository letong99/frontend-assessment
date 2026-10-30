import { useCallback, useEffect, useRef, useState } from 'react'
import type { Segment } from '../../api/types'
import './preferences.css'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'meridian-theme'
const SEGMENT_STORAGE_KEY = 'meridian-segment'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

function isSegment(value: string | null): value is Segment {
  return value === 'retail' || value === 'premium'
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // The root attribute still updates when storage is unavailable.
  }
}

function initialTheme(): Theme {
  const storedTheme = readStorage(THEME_STORAGE_KEY)
  if (isTheme(storedTheme)) return storedTheme

  const rootTheme = document.documentElement.dataset.theme
  if (rootTheme === 'light' || rootTheme === 'dark') return rootTheme

  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function initialSegment(): Segment {
  const storedSegment = readStorage(SEGMENT_STORAGE_KEY)
  if (isSegment(storedSegment)) return storedSegment

  const rootSegment = document.documentElement.dataset.segment
  return rootSegment === 'retail' || rootSegment === 'premium'
    ? rootSegment
    : 'retail'
}

export interface Preferences {
  theme: Theme
  segment: Segment
  setTheme: (theme: Theme) => void
  setSegment: (segment: Segment) => void
  toggleTheme: () => void
}

export function usePreferences(customerSegment?: Segment): Preferences {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [segment, setSegmentState] = useState<Segment>(initialSegment)
  const hasExplicitSegment = useRef(
    isSegment(readStorage(SEGMENT_STORAGE_KEY)),
  )

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    writeStorage(THEME_STORAGE_KEY, nextTheme)
  }, [])

  const setSegment = useCallback((nextSegment: Segment) => {
    hasExplicitSegment.current = true
    setSegmentState(nextSegment)
    document.documentElement.dataset.segment = nextSegment
    writeStorage(SEGMENT_STORAGE_KEY, nextSegment)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.segment = segment
  }, [segment, theme])

  useEffect(() => {
    if (!customerSegment || hasExplicitSegment.current) return

    setSegmentState(customerSegment)
    document.documentElement.dataset.segment = customerSegment
  }, [customerSegment])

  return { theme, segment, setTheme, setSegment, toggleTheme }
}

interface PreferenceControlsProps {
  theme: Theme
  segment: Segment
  onThemeToggle: () => void
  onSegmentChange: (segment: Segment) => void
}

export function PreferenceControls({
  theme,
  segment,
  onThemeToggle,
  onSegmentChange,
}: PreferenceControlsProps) {
  return (
    <div className="preference-controls">
      <div className="segment-switch" role="group" aria-label="Customer segment">
        <button
          type="button"
          aria-pressed={segment === 'retail'}
          onClick={() => onSegmentChange('retail')}
        >
          Retail
        </button>
        <button
          type="button"
          aria-pressed={segment === 'premium'}
          onClick={() => onSegmentChange('premium')}
        >
          Premium
        </button>
      </div>

      <button
        className="theme-toggle"
        type="button"
        aria-pressed={theme === 'dark'}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        onClick={onThemeToggle}
      >
        <span aria-hidden="true">{theme === 'dark' ? '☀' : '◐'}</span>
        <span className="visually-hidden">
          {theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
        </span>
      </button>
    </div>
  )
}
