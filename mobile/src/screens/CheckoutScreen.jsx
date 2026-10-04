import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { createOrder, OrderError } from '../services/orderService.js'
import { signInWithGoogle } from '../services/authService.js'
import { formatNaira } from '../utils/currency.js'
import { validateCheckoutFields } from '../utils/validation.js'
import { uuidv4 } from '../utils/uuid.js'

export default function CheckoutScreen({ navigation }) {
  const { user, loading } = useAuth()
  const { items, subtotal, ready, clear } = useCart()

  const [fullName, setFullName] = useState(
    () => user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  )
  // Prefilled from the Google account and still editable.
  const [email, setEmail] = useState(() => user?.email || '')
  const [phone, setPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  // One key per checkout attempt, reused across retries so a double-tap or a
  // network retry can never create a second order. Rotated only after success.
  const [idempotencyKey, setIdempotencyKey] = useState(() => uuidv4())

  if (loading || !ready) {
    return (
      <View style={styles.center}>
        <Text>Checking your sign-in status...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to checkout</Text>
        <Text style={styles.subtitle}>Please sign in with Google before completing your order.</Text>
        <Pressable
          style={styles.googleButton}
          onPress={() => signInWithGoogle().catch((err) => setError(err.message))}
        >
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Your cart is empty.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.primaryText}>Add products before checking out</Text>
        </Pressable>
      </View>
    )
  }

  async function handleSubmit() {
    if (submitting) return

    setError('')
    setFieldErrors({})

    const nextFieldErrors = validateCheckoutFields({ fullName, email, phone, deliveryAddress, items })
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('Please fix the highlighted fields and try again.')
      return
    }

    setSubmitting(true)
    try {
      const total = subtotal
      const result = await createOrder({
        customer: { fullName, email, phone, deliveryAddress },
        items,
        idempotencyKey
      })

      // Success only: clear the cart rows, then rotate the key for next time.
      clear()
      setIdempotencyKey(uuidv4())

      navigation.replace('Success', {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total,
        emailSent: result.emailSent,
        email
      })
    } catch (err) {
      // Failure: keep the cart intact so the customer can retry.
      if (err instanceof OrderError && err.fieldErrors) setFieldErrors(err.fieldErrors)
      setError(err.message || 'We could not place your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? (
        <Text style={styles.error} role="alert">
          {error}
        </Text>
      ) : null}

      <Text style={styles.sectionTitle}>Customer information</Text>
      <Field
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
        editable={!submitting}
        placeholder="Enter your full name"
      />
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        editable={!submitting}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
        editable={!submitting}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.sectionTitle}>Delivery address</Text>
      <Field
        label="Address"
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        error={fieldErrors.deliveryAddress}
        editable={!submitting}
        placeholder="Enter your delivery address"
        multiline
      />

      <Text style={styles.sectionTitle}>Order summary</Text>
      {items.map((item) => (
        <View key={item.productId} style={styles.summaryRow}>
          <Text style={styles.summaryName}>
            {item.quantity} x {item.name}
          </Text>
          <Text style={styles.summaryPrice}>{formatNaira(item.price * item.quantity)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatNaira(subtotal)}</Text>
      </View>

      <Pressable
        style={[styles.primaryButton, submitting && styles.disabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.primaryText}>{submitting ? 'Processing Order...' : 'Place Order'}</Text>
      </Pressable>
    </ScrollView>
  )
}

function Field({ label, error, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, error && styles.inputError]} {...inputProps} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
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
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22
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
  },
  empty: {
    fontSize: 16,
    marginBottom: 16
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16
  },
  disabled: {
    opacity: 0.6
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  container: {
    padding: 16,
    paddingBottom: 40
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8
  },
  field: {
    marginBottom: 10
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff'
  },
  inputError: {
    borderColor: '#b91c1c'
  },
  fieldError: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: 4
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  summaryName: {
    flex: 1,
    fontSize: 14,
    paddingRight: 8
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '600'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 10,
    paddingTop: 10
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700'
  }
})
