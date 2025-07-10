
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024
const STORAGE_KEY = 'lovable-layout-preferences'

// Debounce utility for performance
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Enhanced state management with persistence
const useResponsiveState = () => {
  const [windowWidth, setWindowWidth] = React.useState<number>(0)
  const [mounted, setMounted] = React.useState(false)
  const [layoutPreferences, setLayoutPreferences] = React.useState<{
    lastKnownWidth: number
    preferredLayout: 'mobile' | 'tablet' | 'desktop'
  }>({
    lastKnownWidth: 0,
    preferredLayout: 'desktop'
  })

  // Debounce window width changes to prevent layout thrashing
  const debouncedWidth = useDebounce(windowWidth, 100)

  React.useLayoutEffect(() => {
    // Load preferences from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const preferences = JSON.parse(stored)
        setLayoutPreferences(preferences)
      }
    } catch (error) {
      console.warn('Failed to load layout preferences:', error)
    }

    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        setWindowWidth(window.innerWidth)
      }
    }

    // Initial width
    updateWidth()
    setMounted(true)

    // Create optimized resize handler
    const handleResize = () => {
      updateWidth()
    }

    // Use passive listener for better performance
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Update preferences when width changes
  React.useEffect(() => {
    if (!mounted || debouncedWidth === 0) return

    const newLayout = debouncedWidth < MOBILE_BREAKPOINT 
      ? 'mobile' 
      : debouncedWidth < TABLET_BREAKPOINT 
        ? 'tablet' 
        : 'desktop'

    const newPreferences = {
      lastKnownWidth: debouncedWidth,
      preferredLayout: newLayout
    }

    setLayoutPreferences(newPreferences)

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    } catch (error) {
      console.warn('Failed to save layout preferences:', error)
    }
  }, [debouncedWidth, mounted])

  return {
    width: debouncedWidth,
    mounted,
    preferences: layoutPreferences
  }
}

export function useIsMobile() {
  const { width, mounted, preferences } = useResponsiveState()
  
  // During SSR or before mounting, return false to prevent hydration mismatch
  if (!mounted) return false
  
  // Use actual width when available, fallback to preferences for consistency
  const isMobile = width > 0 ? width < MOBILE_BREAKPOINT : preferences.preferredLayout === 'mobile'
  
  return isMobile
}

export function useIsTablet() {
  const { width, mounted, preferences } = useResponsiveState()
  
  // During SSR or before mounting, return false to prevent hydration mismatch
  if (!mounted) return false
  
  // Use actual width when available, fallback to preferences for consistency
  const isTablet = width > 0 
    ? width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
    : preferences.preferredLayout === 'tablet'
  
  return isTablet
}

export function useIsDesktop() {
  const { width, mounted, preferences } = useResponsiveState()
  
  // During SSR or before mounting, return true as default
  if (!mounted) return true
  
  // Use actual width when available, fallback to preferences for consistency
  const isDesktop = width > 0 
    ? width >= TABLET_BREAKPOINT
    : preferences.preferredLayout === 'desktop'
  
  return isDesktop
}

// Hook for getting current layout info
export function useLayoutInfo() {
  const { width, mounted, preferences } = useResponsiveState()
  
  return {
    width,
    mounted,
    isMobile: useIsMobile(),
    isTablet: useIsTablet(),
    isDesktop: useIsDesktop(),
    currentLayout: preferences.preferredLayout,
    breakpoints: {
      mobile: MOBILE_BREAKPOINT,
      tablet: TABLET_BREAKPOINT
    }
  }
}
