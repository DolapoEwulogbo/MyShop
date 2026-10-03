import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Navbar() {
  const { count } = useCart()
  const { user, loading } = useAuth()
  return (
    <header>
      <nav aria-label="Main navigation">
        <NavLink to="/" className="brand">
          My Shop
        </NavLink>
        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        <NavLink to="/cart" className={navClass}>
          Cart{count > 0 ? ' (' + count + ')' : ''}
        </NavLink>
        <NavLink to="/orders" className={navClass}>
          Orders
        </NavLink>
        <NavLink to="/account" className={navClass}>
          {loading ? 'Account' : user ? 'Account' : 'Sign in'}
        </NavLink>
      </nav>
    </header>
  )
}

function navClass(nav) {
  return nav.isActive ? 'active' : undefined
}
