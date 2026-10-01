import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import {
  supabase,
  authStorageKey,
  pkceLegacyVerifierKey,
  pkceFlowSlotKey,
  pkceFlowIndexKey
} from '../lib/supabase.js'

function safeNext(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) return value
  return '/checkout'
}

// Lists PKCE-related localStorage key NAMES only — never values or tokens.
// Answers the one question that matters: does the verifier for this callback
// still exist, or was it already consumed before this page ran?
function readPkceStorage() {
  const keys = []
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key && key.includes('code-verifier')) keys.push(key)
    }
    return { storageReadable: true, keys: keys.sort() }
  } catch {
    return { storageReadable: false, keys: [] }
  }
}

// Supabase sends users back here after Google with ?code= (PKCE).
// Purpose: exchange the code ONCE for a session, then forward to ?next=.
// Do NOT combine detectSessionInUrl auto-exchange with this manual exchange:
// the client's auto-exchange consumes the one-time code and deletes the
// verifier first, so this exchange fails with AuthPKCECodeVerifierMissingError
// and the user bounces to /login. The client in lib/supabase.js must therefore
// be created with detectSessionInUrl: false.
let exchangedCode = null

export default function AuthCallback() {
  const navigate = useNavigate()
  const [debug, setDebug] = useState(null)

  useEffect(() => {
    let active = true

    async function run() {
      // React StrictMode mounts effects twice in dev — never exchange the same
      // one-time code twice (the second exchange finds no verifier).
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorParam = params.get('error')
      const errorDescription = params.get('error_description')
      const next = safeNext(params.get('next'))
      const flowIdParam = params.get('sb_flow_id')
      const storage = readPkceStorage()
      const slotKey = flowIdParam ? pkceFlowSlotKey(flowIdParam) : null

      // Everything here is safe to share: key names, booleans and the public
      // origin/next path. No code, no tokens, no verifier values.
      const baseDebug = {
        currentOrigin: window.location.origin,
        callbackPath: window.location.pathname,
        hasCode: Boolean(code),
        queryParamNames: Array.from(params.keys()),
        errorParam: errorParam || null,
        next,
        flowIdInUrl: flowIdParam,
        expectedStorageKey: authStorageKey,
        storageReadable: storage.storageReadable,
        legacyVerifierKey: pkceLegacyVerifierKey,
        legacyVerifierPresent: storage.keys.includes(pkceLegacyVerifierKey),
        flowSlotKey: slotKey,
        flowSlotVerifierPresent: slotKey ? storage.keys.includes(slotKey) : null,
        flowIndexPresent: storage.keys.includes(pkceFlowIndexKey),
        verifierKeyNamesPresent: storage.keys
      }

      function finish(specific) {
        const merged = { ...baseDebug, ...specific }
        const anyVerifier = merged.legacyVerifierPresent || merged.flowSlotVerifierPresent === true
        if (!merged.diagnosis) {
          if (merged.exchangeError) {
            merged.diagnosis = 'The code exchange failed — see exchangeError.'
          } else if (!merged.hasCode) {
            merged.diagnosis =
              'No ?code= arrived. Supabase redirected without a PKCE code — check Authentication → URL Configuration includes this exact /auth/callback URL.'
          } else if (anyVerifier) {
            merged.diagnosis = 'A verifier is still in storage, so the exchange has what it needs.'
          } else {
            merged.diagnosis =
              'No PKCE verifier left in storage: it was already consumed (the Supabase client auto-exchanged this code because detectSessionInUrl is true) or storage was blocked. This is the classic double-exchange symptom.'
          }
        }
        setDebug(merged)
      }

      if (errorParam) {
        finish({ exchangeError: errorDescription || errorParam })
        if (!active) return
        navigate(
          '/login?error=' +
            encodeURIComponent(errorDescription || errorParam || 'Sign-in failed. Please try again.'),
          { replace: true }
        )
        return
      }

      if (!code) {
        finish({})
        if (!active) return
        navigate('/login?error=' + encodeURIComponent('No sign-in code was provided. Please try again.'), {
          replace: true
        })
        return
      }

      if (exchangedCode === code) return
      exchangedCode = code

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session) throw new Error('Sign-in did not complete. Please try again.')

        finish({ exchanged: true, exchangeError: null })
        if (!active) return
        window.history.replaceState(null, '', '/auth/callback')
        navigate(next, { replace: true })
      } catch (err) {
        const message = err?.message || 'Sign-in failed. Please try again.'
        finish({ exchanged: false, exchangeError: message })
        if (!active) return
        navigate('/login?error=' + encodeURIComponent(message), { replace: true })
      }
    }

    run()

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <section className="callback-page">
      <Loading message="Finishing Google sign-in..." />
      {debug && (
        <details className="debug-panel">
          <summary>Sign-in debug info (safe to share — no tokens)</summary>
          <dl>
            <dt>Current origin</dt>
            <dd>{debug.currentOrigin}</dd>
            <dt>Callback path</dt>
            <dd>{debug.callbackPath}</dd>
            <dt>hasCode</dt>
            <dd>{String(debug.hasCode)}</dd>
            <dt>Query parameter names</dt>
            <dd>{debug.queryParamNames.length ? debug.queryParamNames.join(', ') : '(none)'}</dd>
            <dt>next</dt>
            <dd>{debug.next}</dd>
            <dt>flow id in URL</dt>
            <dd>{debug.flowIdInUrl ?? '(none — flow-id redirects are opt-in)'}</dd>
            <dt>exchangeError</dt>
            <dd>{debug.exchangeError ?? '(none)'}</dd>
            <dt>PKCE verifier (legacy key)</dt>
            <dd>
              {debug.legacyVerifierPresent ? 'present' : 'MISSING'} — {debug.legacyVerifierKey}
            </dd>
            <dt>PKCE verifier (flow slot)</dt>
            <dd>
              {debug.flowSlotVerifierPresent === null
                ? 'n/a (no flow id in URL)'
                : debug.flowSlotVerifierPresent
                  ? `present — ${debug.flowSlotKey}`
                  : `MISSING — ${debug.flowSlotKey}`}
            </dd>
            <dt>localStorage reachable</dt>
            <dd>{String(debug.storageReadable)}</dd>
            <dt>Verifier key names in storage</dt>
            <dd>
              {debug.verifierKeyNamesPresent.length
                ? debug.verifierKeyNamesPresent.join(', ')
                : '(none)'}
            </dd>
            <dt>Diagnosis</dt>
            <dd>{debug.diagnosis}</dd>
          </dl>
        </details>
      )}
      {debug?.exchangeError && (
        <p>
          <Link className="button-secondary" to="/login">
            Back to sign in
          </Link>
        </p>
      )}
    </section>
  )
}
