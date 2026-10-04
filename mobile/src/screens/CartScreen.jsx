import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatNaira } from '../utils/currency.js'

export default function CartScreen({ navigation }) {
  const { user } = useAuth()
  const { items, count, subtotal, ready, notice, updateQuantity, remove } = useCart()

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text>Loading your cart...</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Your cart is empty.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.primaryText}>Start shopping</Text>
        </Pressable>
      </View>
    )
  }

  function handleCheckout() {
    if (!user) navigation.navigate('Login', { next: 'Checkout' })
    else navigation.navigate('Checkout')
  }

  return (
    <View style={styles.container}>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.details}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.price}>{formatNaira(item.price)}</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.step}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.step}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
              {item.stock <= 0 ? <Text style={styles.out}>Out of Stock</Text> : null}
            </View>
            <Pressable style={styles.removeButton} onPress={() => remove(item.productId)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total ({count} {count === 1 ? 'item' : 'items'})
          </Text>
          <Text style={styles.totalValue}>{formatNaira(subtotal)}</Text>
        </View>
        <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>
            {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  empty: {
    fontSize: 16,
    marginBottom: 16
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  notice: {
    padding: 12,
    textAlign: 'center',
    color: '#166534',
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 12,
    marginTop: 10,
    gap: 10
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  details: {
    flex: 1
  },
  name: {
    fontSize: 14,
    fontWeight: '600'
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  stepText: {
    fontSize: 15,
    fontWeight: '700'
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center'
  },
  out: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: 4
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fee2e2'
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 12
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    paddingBottom: 24
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700'
  },
  checkoutButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  checkoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  }
})
