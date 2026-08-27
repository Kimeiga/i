import { prisma } from './prisma'
import { UserCard } from './UserCard'

// Only the two fields the component renders cross the boundary.
export default async function SettingsPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({ where: { id: params.id } })

  return (
    <main>
      <h1>Settings</h1>
      <UserCard name={user.name} avatarUrl={user.avatarUrl} />
    </main>
  )
}
