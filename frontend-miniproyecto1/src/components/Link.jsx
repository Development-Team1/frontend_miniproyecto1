import { navigate } from '../lib/router'

export default function Link({ to, children, ...props }) {
  const alClic = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} onClick={alClic} {...props}>
      {children}
    </a>
  )
}
