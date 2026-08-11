// Stand-in for a generated database client, so the fixture parses without the
// real dependency installed.
export interface UserRecord {
  id: string
  name: string
  avatarUrl?: string
  email: string
  passwordHash: string
  internalRiskScore: number
}

export const prisma = {
  user: {
    async findUnique(_args: { where: { id: string } }): Promise<UserRecord> {
      throw new Error('fixture only')
    },
  },
}
