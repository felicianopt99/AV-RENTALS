import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const backupDir = '/mnt/backup_drive/av-rentals/backups'
    const projectRoot = process.cwd()
    const configPath = path.join(projectRoot, 'backup.config.json')
    let config: any = null
    try {
      const raw = fs.readFileSync(configPath, 'utf8')
      config = JSON.parse(raw)
    } catch {}
    
    // Detect restic repo if present (for future enterprise mode)
    const resticRepo = '/mnt/backup_drive/av-rentals/restic-repo'
    const hasResticRepo = fs.existsSync(path.join(resticRepo, 'config'))
    
    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        availableBackups: 0,
        rotationBackups: [],
        message: 'Backup directory not found. No backups created yet.',
        backupDirectory: backupDir,
        hasResticRepo,
        resticRepo,
        config
      })
    }

    // Find timestamped backup directories created by backup-helper.sh
    const entries = fs.readdirSync(backupDir)
      .filter(name => name.startsWith('backup_'))
      .map(name => {
        const fullPath = path.join(backupDir, name)
        const stat = fs.statSync(fullPath)
        return { name, fullPath, stat }
      })
      .filter(e => e.stat.isDirectory())
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)

    // Build rotation (latest 3 backups)
    const rotationBackups: any[] = []
    for (let i = 0; i < Math.min(3, entries.length); i++) {
      const e = entries[i]
      // Compute directory size (non-recursive)
      let sizeBytes = 0
      try {
        const files = fs.readdirSync(e.fullPath)
        for (const f of files) {
          const fstat = fs.statSync(path.join(e.fullPath, f))
          if (fstat.isFile()) sizeBytes += fstat.size
        }
      } catch {}
      rotationBackups.push({
        day: i + 1,
        file: e.name,
        size: `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        date: e.stat.mtime.toISOString().split('T')[0],
        type: 'uncompressed',
        age: Math.floor((Date.now() - e.stat.mtime.getTime()) / (1000 * 60 * 60 * 24)),
      })
    }
    const availableBackups = rotationBackups.length

    // Calculate current rotation day
    const dayOfWeek = new Date().getDay() // 0-6 (Sunday=0)
    const currentRotationDay = (dayOfWeek % 3) + 1

    return NextResponse.json({
      availableBackups,
      rotationBackups,
      currentRotationDay,
      totalFiles: entries.length,
      backupDirectory: backupDir,
      hasResticRepo,
      resticRepo,
      config,
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