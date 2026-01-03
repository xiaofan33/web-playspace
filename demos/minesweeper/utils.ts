export function formatNumber(num: number) {
  return Math.min(999, Math.floor(num)).toString().padStart(3, '0')
}

export function isTouchDevice() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  )
}
