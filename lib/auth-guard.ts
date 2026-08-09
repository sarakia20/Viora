import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'

export async function requireUser() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return session
}

export async function requireAdmin() {
  const session = await requireUser()
  await connectToDatabase()
  const user = await User.findById(session.user.id).select('role').lean()

  if (user?.role !== 'Admin') {
    throw new Error('Forbidden')
  }

  session.user.role = user.role
  return session
}
