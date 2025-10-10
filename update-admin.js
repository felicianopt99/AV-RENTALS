const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminUser() {
  try {
    // Create a new simple password
    const newPassword = await bcrypt.hash('admin', 12);
    
    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: { username: 'admin' },
      data: {
        username: 'admin',
        password: newPassword,
      }
    });
    
    console.log('Updated admin user:');
    console.log({
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive
    });
    
    // Test the new password
    const testResult = await bcrypt.compare('admin', updatedUser.password);
    console.log('New password "admin" works:', testResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser();