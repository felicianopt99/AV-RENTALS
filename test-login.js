const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      username: user.username,
      hasPassword: !!user.password,
      isActive: user.isActive
    });
    
    // Test the password
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log(`Password "${testPassword}" is valid:`, isValid);
    
    // Test what happens if we hash the password again
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('New hash matches:', await bcrypt.compare(testPassword, newHash));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();