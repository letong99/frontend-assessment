import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  PreferenceControls,
  usePreferences,
  type Preferences,
} from './Preferences'

function ControlsHarness({ customerSegment }: { customerSegment?: 'retail' | 'premium' }) {
  const preferences: Preferences = usePreferences(customerSegment)

  return (
    <PreferenceControls
      theme={preferences.theme}
      segment={preferences.segment}
      onThemeToggle={preferences.toggleTheme}
      onSegmentChange={preferences.setSegment}
    />
  )
}

describe('preferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.dataset.theme = 'light'
    document.documentElement.dataset.segment = 'retail'
  })

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.dataset.theme = 'light'
    document.documentElement.dataset.segment = 'retail'
  })

  it('reconciles the API segment when there is no explicit preference', async () => {
    const { result } = renderHook(() => usePreferences('premium'))

    await waitFor(() => expect(result.current.segment).toBe('premium'))
    expect(document.documentElement).toHaveAttribute(
      'data-segment',
      'premium',
    )
    expect(window.localStorage.getItem('meridian-segment')).toBeNull()
  })

  it('keeps a stored segment instead of replacing it with the API default', () => {
    window.localStorage.setItem('meridian-segment', 'premium')

    const { result } = renderHook(() => usePreferences('retail'))

    expect(result.current.segment).toBe('premium')
    expect(document.documentElement).toHaveAttribute(
      'data-segment',
      'premium',
    )
  })

  it('persists explicit accessible theme and segment choices', async () => {
    const user = userEvent.setup()
    render(<ControlsHarness customerSegment="retail" />)

    const premium = screen.getByRole('button', { name: 'Premium' })
    const theme = screen.getByRole('button', { name: 'Switch to dark mode' })

    await user.click(premium)
    await user.click(theme)

    expect(premium).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('data-segment', 'premium')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem('meridian-segment')).toBe('premium')
    expect(window.localStorage.getItem('meridian-theme')).toBe('dark')
  })
})
