import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const backupDir = path.join(process.env.HOME || '/tmp', 'backups', 'av-rentals')
    
    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        availableBackups: 0,
        rotationBackups: [],
        message: 'Backup directory not found. No backups created yet.'
      })
    }

    const rotationBackups = []
    let availableBackups = 0

    // Check each day backup (1, 2, 3)
    for (let day = 1; day <= 3; day++) {
      const backupFile = path.join(backupDir, `av_rentals_backup_day${day}.db`)
      const compressedBackup = `${backupFile}.gz`

      let backupInfo = null

      // Check uncompressed backup first
      if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile)
        backupInfo = {
          day,
          file: `av_rentals_backup_day${day}.db`,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          date: stats.mtime.toISOString().split('T')[0],
          type: 'uncompressed',
          age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
        }
        availableBackups++
      }
      // Check compressed backup if uncompressed doesn't exist
      else if (fs.existsSync(compressedBackup)) {
        const stats = fs.statSync(compressedBackup)
        backupInfo = {
          day,
          file: `av_rentals_backup_day${day}.db.gz`,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          date: stats.mtime.toISOString().split('T')[0],
          type: 'compressed',
          age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
        }
        availableBackups++
      }

      if (backupInfo) {
        rotationBackups.push(backupInfo)
      }
    }

    // Get additional backup information
    const allFiles = fs.readdirSync(backupDir)
    const timestampedBackups = allFiles.filter(file => 
      file.includes('backup_day') && file.includes('_') && !file.endsWith('.previous')
    ).length

    // Calculate current rotation day
    const dayOfWeek = new Date().getDay() // 0-6 (Sunday=0)
    const currentRotationDay = (dayOfWeek % 3) + 1

    return NextResponse.json({
      availableBackups,
      rotationBackups,
      currentRotationDay,
      totalFiles: allFiles.length,
      timestampedBackups,
      backupDirectory: backupDir,
      systemStatus: {
        rotationComplete: availableBackups === 3,
        healthStatus: availableBackups >= 2 ? 'healthy' : availableBackups >= 1 ? 'warning' : 'critical',
        storageEfficiency: '~97% less storage than 30-day retention'
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Backup status API error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to get backup status',
        details: error instanceof Error ? error.message : 'Unknown error',
        availableBackups: 0,
        rotationBackups: []
      },
      { status: 500 }
    )
  }
}