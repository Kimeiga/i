'use server'

import { revalidatePath } from 'next/cache'

export async function updateProductName(id: string, name: string) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
  // Discards every cached route in the application on every product rename.
  revalidatePath('/', 'layout')
}

export async function publishPost(id: string) {
  await fetch(`https://api.example.com/posts/${id}/publish`, { method: 'POST' })
  revalidatePath('/')
}
