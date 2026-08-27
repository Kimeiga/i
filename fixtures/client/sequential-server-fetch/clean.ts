async function getProfile(userId: string): Promise<{ id: string; teamId: string }> {
  return fetch(`https://api.example.com/users/${userId}`).then((r) => r.json())
}

async function getTeam(teamId: string): Promise<{ id: string; name: string }> {
  return fetch(`https://api.example.com/teams/${teamId}`).then((r) => r.json())
}

async function getFeatureFlags(): Promise<Record<string, boolean>> {
  return fetch('https://api.example.com/flags').then((r) => r.json())
}

// The second call needs the first call's result, so the sequence is required.
export async function loadTeamForUser(userId: string) {
  const profile = await getProfile(userId)
  const team = await getTeam(profile.teamId)
  return { profile, team }
}

// Independent calls, started together.
export async function loadDashboard(userId: string) {
  const [profile, flags] = await Promise.all([getProfile(userId), getFeatureFlags()])
  return { profile, flags }
}
