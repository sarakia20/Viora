import { Metadata } from 'next'

import OverviewReport from './overview-report'
import { auth } from '@/auth'
export const metadata: Metadata = {
  title: 'داشبورد مدیریت',
}
const DashboardPage = async () => {
  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('دسترسی مدیریت لازم است')

  return <OverviewReport />
}

export default DashboardPage
