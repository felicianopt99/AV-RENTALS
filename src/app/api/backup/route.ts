import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('Starting 3-day rotation backup from admin panel...')

    // Use the project backup helper script
    const scriptPath = path.join(process.cwd(), 'backup-helper.sh')
    
    // Execute the backup script with the create command
    const { stdout, stderr } = await execAsync(`bash "${scriptPath}" create`)
    
    console.log('Backup script output:', stdout)
    if (stderr) {
      console.warn('Backup script stderr:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: `Backup completed successfully`,
      output: stdout,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Backup API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Backup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const backupDir = '/mnt/backup_drive/av-rentals/backups'
    // List backups and include metadata
    const entries = await fs.readdir(backupDir)
    const backups = await Promise.all(
      entries
        .filter((name) => name.startsWith('backup_'))
        .map(async (name) => {
          const fullPath = path.join(backupDir, name)
          const stat = await fs.stat(fullPath)
          return {
            name,
            path: fullPath,
            sizeBytes: stat.size,
            mtime: stat.mtime,
            ctime: stat.ctime,
            isDirectory: stat.isDirectory(),
          }
        })
    )
    // Sort newest first
    backups.sort((a, b) => +b.mtime - +a.mtime)

    return NextResponse.json({
      success: true,
      backups,
      backupDir,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Backup status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read backup status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}