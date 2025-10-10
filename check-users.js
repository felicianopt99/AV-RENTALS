const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      }
    });
    
    console.log('Users in database:');
    console.table(users);
    
    // Also check if we can find the admin user specifically
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    console.log('\nAdmin user details:');
    if (adminUser) {
      console.log({
        id: adminUser.id,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
        hasPassword: !!adminUser.password
      });
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();