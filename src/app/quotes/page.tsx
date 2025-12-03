import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { QuotesContent } from '@/components/quotes/QuotesContent';

export default async function QuotesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const allowedRoles = ['admin', 'manager', 'employee'];

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      redirect('/login');
    }
    const userRole = String(user.role || '').toLowerCase();
    if (!allowedRoles.includes(userRole)) {
      redirect('/unauthorized');
    }
  } catch {
    redirect('/login');
  }

  return <QuotesContent />;
}