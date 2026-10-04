import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useCart } from '../context/CartContext.jsx'
import { getProductById } from '../services/productService.js'
import { formatNaira, getAvailability } from '../utils/currency.js'

export default function ProductScreen({ route }) {
  const { id } = route.params
  const { add, notice, flashNotice } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    let active = true
    getProductById(id)
      .then((p) => {
        if (active) setProduct(p)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading product...</Text>
      </View>
    )
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Product not found.'}</Text>
      </View>
    )
  }

  const availability = getAvailability(product.stock)
  const out = product.stock <= 0

  function handleAdd() {
    const result = add(product, qty)
    if (result.added) {
      flashNotice(result.capped ? `Only ${product.stock} in stock — quantity adjusted.` : 'Added to cart.')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: product.image_url }} style={styles.image} />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{formatNaira(product.price)}</Text>
      <Text style={[styles.stock, out && styles.stockOut]}>{availability.label}</Text>
      {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <Pressable style={styles.step} onPress={() => setQty((q) => Math.max(1, q - 1))} disabled={out}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{qty}</Text>
        <Pressable
          style={styles.step}
          onPress={() => setQty((q) => Math.min(product.stock, q + 1))}
          disabled={out}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.addButton, out && styles.addButtonDisabled]}
        disabled={out}
        onPress={handleAdd}
      >
        <Text style={styles.addButtonText}>{out ? 'Out of Stock' : 'Add to Cart'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center'
  },
  container: {
    padding: 16
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f1f5f9'
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4
  },
  stock: {
    fontSize: 13,
    marginTop: 4,
    color: '#166534'
  },
  stockOut: {
    color: '#b91c1c'
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    marginTop: 12
  },
  notice: {
    marginTop: 12,
    color: '#166534',
    fontWeight: '600'
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20
  },
  qtyLabel: {
    fontSize: 15,
    fontWeight: '600'
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  stepText: {
    fontSize: 18,
    fontWeight: '700'
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center'
  },
  addButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20
  },
  addButtonDisabled: {
    backgroundColor: '#94a3b8'
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  }
})
