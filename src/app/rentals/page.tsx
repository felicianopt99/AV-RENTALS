import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

export default async function RentalsRootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const allowedRoles = ['Admin', 'Manager', 'Technician', 'Employee'];

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      redirect('/login');
    }
    if (!allowedRoles.includes(user.role as any)) {
      redirect('/unauthorized');
    }
  } catch {
    redirect('/login');
  }

  redirect('/rentals/calendar');
}
