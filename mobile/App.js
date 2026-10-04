import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext.jsx'
import { CartProvider } from './src/context/CartContext.jsx'
import HomeScreen from './src/screens/HomeScreen.jsx'
import ProductScreen from './src/screens/ProductScreen.jsx'
import CartScreen from './src/screens/CartScreen.jsx'
import LoginScreen from './src/screens/LoginScreen.jsx'
import CheckoutScreen from './src/screens/CheckoutScreen.jsx'
import SuccessScreen from './src/screens/SuccessScreen.jsx'
import OrdersScreen from './src/screens/OrdersScreen.jsx'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Shop' }} />
            <Stack.Screen name="Product" component={ProductScreen} options={{ title: '' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
            <Stack.Screen
              name="Success"
              component={SuccessScreen}
              options={{ title: 'Order Placed', headerBackVisible: false }}
            />
            <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  )
}
