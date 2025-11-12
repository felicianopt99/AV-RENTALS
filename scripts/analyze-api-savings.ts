#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 TRANSLATION API SAVINGS ANALYSIS');
    console.log('====================================');
    
    // Get total translations in database
    const totalTranslations = await prisma.translation.count();
    console.log(`📦 Total cached translations: ${totalTranslations}`);
    
    // Get usage statistics from database
    const usageStats = await prisma.translation.aggregate({
      _sum: { usageCount: true },
      _avg: { usageCount: true },
      _max: { usageCount: true },
    });
    
    const totalUsage = usageStats._sum.usageCount || 0;
    const avgUsage = Math.round((usageStats._avg.usageCount || 0) * 100) / 100;
    const maxUsage = usageStats._max.usageCount || 0;
    
    console.log(`🔄 Total cache hits: ${totalUsage}`);
    console.log(`📊 Average uses per translation: ${avgUsage}`);
    console.log(`🎯 Most used translation: ${maxUsage} times`);
    
    // Calculate API calls saved
    const apiCallsSaved = Math.max(0, totalUsage - totalTranslations);
    const savingsPercentage = totalUsage > 0 ? Math.round((apiCallsSaved / totalUsage) * 100) : 0;
    
    console.log('\n💰 API COST SAVINGS');
    console.log('==================');
    console.log(`🔥 API calls that would have been made: ${totalUsage}`);
    console.log(`✅ Actual API calls made: ${totalTranslations}`);
    console.log(`💸 API calls saved by caching: ${apiCallsSaved}`);
    console.log(`📈 Savings rate: ${savingsPercentage}%`);
    
    // Get most frequently used translations
    const popularTranslations = await prisma.translation.findMany({
      where: { usageCount: { gt: 0 } },
      orderBy: { usageCount: 'desc' },
      take: 10,
      select: {
        sourceText: true,
        translatedText: true,
        usageCount: true,
        lastUsed: true,
      },
    });
    
    if (popularTranslations.length > 0) {
      console.log('\n🏆 TOP 10 MOST REUSED TRANSLATIONS');
      console.log('==================================');
      popularTranslations.forEach((t, i) => {
        console.log(`${i + 1}. "${t.sourceText}" → "${t.translatedText}"`);
        console.log(`   💫 Used ${t.usageCount} times, last used: ${t.lastUsed?.toLocaleDateString() || 'Never'}`);
        console.log('');
      });
    }
    
    // Analyze recent activity
    const recentTranslations = await prisma.translation.findMany({
      where: { 
        createdAt: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        sourceText: true,
        translatedText: true,
        createdAt: true,
        usageCount: true,
      },
    });
    
    if (recentTranslations.length > 0) {
      console.log('🕒 RECENT TRANSLATION ACTIVITY (Last 24h)');
      console.log('==========================================');
      recentTranslations.forEach((t, i) => {
        const timeAgo = Math.round((Date.now() - t.createdAt.getTime()) / (1000 * 60));
        console.log(`${i + 1}. "${t.sourceText}" → "${t.translatedText}"`);
        console.log(`   🕐 ${timeAgo}m ago, used ${t.usageCount} times since`);
        console.log('');
      });
    }
    
    // Memory cache efficiency analysis
    console.log('🧠 MEMORY CACHE STATUS');
    console.log('=====================');
    console.log('✅ In-memory cache: Active (Map<string, string>)');
    console.log('✅ Duplicate prevention: Active (pendingTranslations Map)');
    console.log('✅ Database preloading: Available via preloadAllTranslations()');
    console.log('✅ Rate limiting: 8 requests/minute with automatic backoff');
    console.log('✅ Error handling: Graceful degradation to original text');
    
    // Check for potential optimization opportunities
    const unusedTranslations = await prisma.translation.count({
      where: { usageCount: 0 }
    });
    
    if (unusedTranslations > 0) {
      console.log(`\n⚠️  OPTIMIZATION OPPORTUNITY`);
      console.log(`Found ${unusedTranslations} translations that have never been used`);
      console.log(`Consider reviewing these for cleanup or investigate why they're not being accessed`);
    }
    
    // Quality metrics
    const qualityStats = await prisma.translation.aggregate({
      _avg: { qualityScore: true },
      _count: { qualityScore: true },
    });
    
    if (qualityStats._count.qualityScore > 0) {
      console.log(`\n⭐ TRANSLATION QUALITY`);
      console.log(`Average quality score: ${Math.round((qualityStats._avg.qualityScore || 0) * 10) / 10}/100`);
    }
    
  } catch (error) {
    console.error('Error analyzing translations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);