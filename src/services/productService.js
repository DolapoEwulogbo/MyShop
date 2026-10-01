// Phase 2: mock-backed service. Phase 4 swaps this to Supabase.
// Pages -> Components -> Services -> data source (AGENTS.md layering rule).
import { getMockProductById, mockProducts } from '../data/mockProducts.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listProducts() {
  await delay(400)
  return mockProducts
}

export async function getProductById(id) {
  await delay(300)
  const product = getMockProductById(id)
  if (!product) {
    throw new Error('Product not found.')
  }
  return product
}
