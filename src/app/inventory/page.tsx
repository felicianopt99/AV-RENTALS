import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { InventoryContent } from '@/components/inventory/InventoryContent';

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) {
      redirect('/login');
    }
  } catch {
    redirect('/login');
  }

  return <InventoryContent />;
}