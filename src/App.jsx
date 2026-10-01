import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Login from './pages/Login.jsx'
import Success from './pages/Success.jsx'
import Orders from './pages/Orders.jsx'
import Account from './pages/Account.jsx'

// Phase 1: routing shell with placeholder pages (AGENTS.md Section 5).
// Real UI arrives in Phases 2-3; auth gating arrives in Phase 5.
export default function App() {
  return (
    <>
      <header>
        <nav aria-label="Main navigation">
          <NavLink to="/" className="brand">
            My Shop
          </NavLink>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Home
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Cart
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Orders
          </NavLink>
          <NavLink to="/account" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Account
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success/:orderId" element={<Success />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
    </>
  )
}
