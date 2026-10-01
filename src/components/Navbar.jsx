import { NavLink } from 'react-router-dom'

// Phase 2: storefront navbar. Cart count + auth state arrive in Phases 3/5.
export default function Navbar() {
  return (
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
  )
}
