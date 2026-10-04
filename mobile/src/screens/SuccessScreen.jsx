import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatNaira } from '../utils/currency.js'

export default function SuccessScreen({ navigation, route }) {
  const { orderNumber, total, emailSent, email } = route.params || {}

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Order Placed</Text>
      <Text style={styles.orderNumber}>Order number: {orderNumber}</Text>
      <Text style={styles.total}>Total: {formatNaira(total)}</Text>
      <Text style={styles.status}>Status: pending — no payment was collected.</Text>
      <Text style={styles.subtitle}>
        {emailSent
          ? `We've sent a confirmation email to ${email || 'your email address'}.`
          : "Your order is placed. We couldn't send the confirmation email, but your order is saved under Orders."}
      </Text>
      <Pressable style={styles.primaryButton} onPress={() => navigation.replace('Orders')}>
        <Text style={styles.primaryText}>View my orders</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.secondaryText}>Continue shopping</Text>
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
    gap: 10
  },
  title: {
    fontSize: 24,
    fontWeight: '700'
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600'
  },
  total: {
    fontSize: 16,
    fontWeight: '700'
  },
  status: {
    fontSize: 13,
    color: '#475569'
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 12
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  secondaryText: {
    color: '#2563eb',
    fontWeight: '600'
  }
})
