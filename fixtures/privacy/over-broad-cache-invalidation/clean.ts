'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function updateProductName(id: string, name: string) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
  revalidatePath(`/products/${id}`)
  revalidateTag(`product:${id}`)
}

export async function publishPost(id: string) {
  await fetch(`https://api.example.com/posts/${id}/publish`, { method: 'POST' })
  revalidatePath('/blog', 'page')
  revalidatePath(`/blog/${id}`)
}
