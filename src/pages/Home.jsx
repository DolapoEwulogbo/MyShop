import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loading from '../components/Loading.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { listProducts } from '../services/productService.js'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (err) {
      setError('We could not load products. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleAdd(product) {
    setNotice('Added ' + product.name + ' to cart')
    if (handleAdd.timer) window.clearTimeout(handleAdd.timer)
    handleAdd.timer = window.setTimeout(() => setNotice(''), 2500)
  }

  return (
    <>
      <section className="hero">
        <h1>Everyday essentials, honestly priced</h1>
        <p>Quality home goods delivered to your door. No payment today.</p>
        <a className="button-primary" href="#products">
          Shop now
        </a>
      </section>

      {notice && (
        <p role="status" aria-live="polite" className="notice">
          {notice}
        </p>
      )}

      <section id="products" aria-label="Products">
        <h2>Products</h2>
        {loading && <Loading message="Loading products..." />}
        {!loading && error && <ErrorMessage message={error} onRetry={load} />}
        {!loading && !error && <ProductGrid products={products} onAdd={handleAdd} />}
      </section>
    </>
  )
}
