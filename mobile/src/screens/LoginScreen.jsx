import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext.jsx'
import { signInWithGoogle } from '../services/authService.js'

export default function LoginScreen({ navigation, route }) {
  const { user, loading } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Where to go once signed in (mirrors the web app's return-to-path).
  const next = route.params?.next || 'Checkout'

  useEffect(() => {
    if (user) navigation.replace(next)
  }, [user, next, navigation])

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Checking your sign-in status...</Text>
      </View>
    )
  }

  if (user) return null

  async function handleSignIn() {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      // The browser opens and Google takes over from here. When the browser
      // redirects back into the app, onAuthStateChange signs the user in and
      // the effect above moves them on.
    } catch (err) {
      setError(err.message || 'We could not start Google sign-in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Sign in to My Shop</Text>
      <Text style={styles.subtitle}>
        Use the same Google account you use on the website — that is what keeps your cart in sync
        between them.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.googleButton} onPress={handleSignIn} disabled={busy}>
        <Text style={styles.googleText}>{busy ? 'Opening Google...' : 'Continue with Google'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center'
  },
  googleButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8
  },
  googleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  }
})
