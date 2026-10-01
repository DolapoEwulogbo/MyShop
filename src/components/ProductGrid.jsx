import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ products, onAdd }) {
  if (products.length === 0) {
    return (
      <div className="state-message">
        <p>No products are available right now.</p>
      </div>
    )
  }

  return (
    <div className="grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  )
}
