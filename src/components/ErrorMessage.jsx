export default function ErrorMessage({ message, onRetry }) {
  return (
    <div role="alert" className="state-message state-error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
