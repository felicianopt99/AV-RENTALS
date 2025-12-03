import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    })
    if (!user || !user.isActive) {
      redirect('/login')
    }
    const role = String(user.role || '').toLowerCase()
    if (role !== 'admin') {
      redirect('/unauthorized')
    }
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}
