import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userId: string | null = null;
  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any;
    userId = decoded.userId as string;
  } catch {
    redirect('/login');
  }

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect('/login');
  }

  const allowedRoles = ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer'];
  if (!allowedRoles.includes(user.role as any)) {
    redirect('/unauthorized');
  }

  return <DashboardContent />;
}