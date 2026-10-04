import { supabase } from '../lib/supabase.js'

function mapError(action) {
  return new Error('We could not load products. Please check your connection and try again. (' + action + ')')
}

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, stock')
    .order('name', { ascending: true })
  if (error) throw mapError('list')
  return data ?? []
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, stock')
    .eq('id', id)
    .single()
  if (error || !data) throw new Error('We could not load this product. It may have been removed.')
  return data
}
