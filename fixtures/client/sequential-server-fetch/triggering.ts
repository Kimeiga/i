async function getProfile(userId: string): Promise<{ id: string; name: string }> {
  return fetch(`https://api.example.com/users/${userId}`).then((r) => r.json())
}

async function getFeatureFlags(): Promise<Record<string, boolean>> {
  return fetch('https://api.example.com/flags').then((r) => r.json())
}

// Two independent round trips, one after the other. The page cannot start
// rendering until both have returned.
export async function loadDashboard(userId: string) {
  const profile = await getProfile(userId)
  const flags = await getFeatureFlags()
  return { profile, flags }
}
