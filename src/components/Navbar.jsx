import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

// Phase 3: navbar with live cart count. Auth state arrives in Phase 5.
export default function Navbar() {
  const { count } = useCart()
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
          Account
        </NavLink>
      </nav>
    </header>
  )
}

function navClass(nav) {
  return nav.isActive ? 'active' : undefined
}
