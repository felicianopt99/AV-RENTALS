import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('Starting 3-day rotation backup from admin panel...')

    // Get the backup script path
    const scriptPath = path.join(process.cwd(), 'scripts', 'backup-database.sh')
    
    // Execute the backup script
    const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`)
    
    console.log('Backup script output:', stdout)
    if (stderr) {
      console.warn('Backup script stderr:', stderr)
    }

    // Parse output to get backup information
    const lines = stdout.split('\n')
    const dayMatch = stdout.match(/Day (\d+)/i)
    const currentDay = dayMatch ? dayMatch[1] : 'Unknown'

    return NextResponse.json({
      success: true,
      message: `Day ${currentDay} backup completed successfully`,
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
  return NextResponse.json({
    message: 'Use POST to create a backup',
    availableEndpoints: {
      'POST /api/backup': 'Create a new 3-day rotation backup',
      'GET /api/backup/status': 'Get backup status information'
    }
  })
}