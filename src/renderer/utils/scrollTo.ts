function easeInOutQuad(t, b, c, d) {
  t /= d / 2
  if (t < 1) {
    return (c / 2) * t * t + b
  }
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}

interface Params {
  dom?: Element
  to?: number
  duration?: number
  callback?: () => any
}

/**
 * @param {number} to
 * @param {number} duration
 * @param {Function} callback
 */
export function scrollTo({
  to = 100,
  duration = 800,
  callback,
  dom = document.body
}: Params = {}) {
  const start = dom.scrollTop
  const change = to - start
  const increment = 20
  let currentTime = 0
  const animateScroll = () => {
    // increment the time
    currentTime += increment
    // find the value with the quadratic in-out easing function
    const val = easeInOutQuad(currentTime, start, change, duration)
    // move the document.body
    dom.scrollTop = val
    // do the animation unless its over
    if (currentTime < duration) {
      window.requestAnimationFrame(animateScroll)
    } else {
      if (callback && typeof callback === 'function') {
        // the animation is done so lets callback
        callback()
      }
    }
  }
  animateScroll()
}
