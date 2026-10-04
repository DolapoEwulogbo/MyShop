import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext.jsx'
import { listMyOrders } from '../services/orderService.js'
import { formatNaira } from '../utils/currency.js'

export default function OrdersScreen({ navigation }) {
  const { user, loading, signOut } = useAuth()
  const [orders, setOrders] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setOrders(await listMyOrders())
    } catch (err) {
      setError(err.message || 'We could not load your orders.')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) load()
    else setListLoading(false)
  }, [user, load])

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Checking your sign-in status...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Your orders</Text>
        <Text style={styles.subtitle}>Sign in to see the orders you placed.</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login', { next: 'Orders' })}
        >
          <Text style={styles.primaryText}>Sign in with Google</Text>
        </Pressable>
      </View>
    )
  }

  function formatDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB')
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {listLoading ? 'Loading your orders...' : error || 'No orders yet.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.orderRow}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>Order #{item.order_number}</Text>
              <Text style={styles.orderDate}>
                {formatDate(item.created_at)} — {item.status}
              </Text>
            </View>
            <Text style={styles.orderTotal}>{formatNaira(item.total_amount)}</Text>
          </View>
        )}
      />
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
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
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  list: {
    padding: 12,
    flexGrow: 1
  },
  empty: {
    textAlign: 'center',
    color: '#475569',
    padding: 24
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10
  },
  orderInfo: {
    flex: 1,
    paddingRight: 8
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700'
  },
  orderDate: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    textTransform: 'capitalize'
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700'
  },
  signOutButton: {
    padding: 16,
    alignItems: 'center'
  },
  signOutText: {
    color: '#b91c1c',
    fontWeight: '600'
  }
})
