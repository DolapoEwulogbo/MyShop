import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useCart } from '../context/CartContext.jsx'
import { listProducts } from '../services/productService.js'
import { formatNaira, getAvailability } from '../utils/currency.js'

export default function HomeScreen({ navigation }) {
  const { count } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setProducts(await listProducts())
    } catch (err) {
      setError(err.message || 'We could not load products.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('Orders')} style={styles.headerLink}>
            <Text style={styles.headerLinkText}>Orders</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Cart')} style={styles.headerLink}>
            <Text style={styles.headerLinkText}>{count > 0 ? `Cart (${count})` : 'Cart'}</Text>
          </Pressable>
        </View>
      )
    })
  }, [navigation, count])

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading products...</Text>
      </View>
    )
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable
          style={styles.retry}
          onPress={() => {
            setLoading(true)
            load()
          }}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            load()
          }}
        />
      }
      ListEmptyComponent={<Text style={styles.center}>No products yet.</Text>}
      renderItem={({ item }) => {
        const availability = getAvailability(item.stock)
        return (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Product', { id: item.id })}
          >
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.price}>{formatNaira(item.price)}</Text>
            <Text
              style={[
                styles.stock,
                availability.tone === 'out' && styles.stockOut,
                availability.tone === 'low' && styles.stockLow
              ]}
            >
              {availability.label}
            </Text>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center'
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
    textAlign: 'center'
  },
  retry: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16
  },
  headerLink: {
    paddingVertical: 4
  },
  headerLinkText: {
    color: '#2563eb',
    fontWeight: '600'
  },
  list: {
    padding: 8,
    flexGrow: 1
  },
  row: {
    gap: 8
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    minHeight: 38
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4
  },
  stock: {
    fontSize: 12,
    marginTop: 4,
    color: '#166534'
  },
  stockLow: {
    color: '#a16207'
  },
  stockOut: {
    color: '#b91c1c'
  }
})
