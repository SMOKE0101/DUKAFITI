
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useLayoutEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Initial check
    checkMobile()

    // Create media query listener
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", checkMobile)
      return () => mediaQuery.removeEventListener("change", checkMobile)
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(checkMobile)
      return () => mediaQuery.removeListener(checkMobile)
    }
  }, [])

  // Return false during SSR to prevent hydration mismatch
  return isMobile ?? false
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useLayoutEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }

    // Initial check
    checkTablet()

    // Create media query listener
    const mediaQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", checkTablet)
      return () => mediaQuery.removeEventListener("change", checkTablet)
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(checkTablet)
      return () => mediaQuery.removeListener(checkTablet)
    }
  }, [])

  // Return false during SSR to prevent hydration mismatch
  return isTablet ?? false
}
