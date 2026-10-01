export default function Loading({ message = 'Loading...' }) {
  return (
    <p role="status" aria-live="polite" className="state-message">
      {message}
    </p>
  )
}
