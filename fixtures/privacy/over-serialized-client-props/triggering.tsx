import { prisma } from './prisma'
import { UserCard } from './UserCard'

// A server component. Everything handed to UserCard is serialised into the
// HTML, including the columns this page never renders.
export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({ where: { id: params.id } })

  return (
    <main>
      <h1>Profile</h1>
      <UserCard user={user} />
    </main>
  )
}
