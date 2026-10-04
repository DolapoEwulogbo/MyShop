// Hermes (React Native's JS engine) has no crypto.randomUUID, so the
// idempotency key uses the same v4 layout from Math.random. The server only
// requires a non-empty string of at most 64 chars — it never trusts this
// value for anything security-related.
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
