import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'backup.config.json')

export async function GET() {
  try {
    let config: any = null
    try {
      const raw = await fs.readFile(CONFIG_PATH, 'utf8')
      config = JSON.parse(raw)
    } catch {
      config = null
    }
    return NextResponse.json({ success: true, config })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Minimal validation
    const retention = body?.retention ?? {}
    const schedule = body?.schedule ?? {}

    const normalized = {
      retention: {
        daily: Math.max(0, Number(retention.daily ?? 7)),
        weekly: Math.max(0, Number(retention.weekly ?? 4)),
        monthly: Math.max(0, Number(retention.monthly ?? 12)),
      },
      schedule: {
        cron: typeof schedule.cron === 'string' && schedule.cron.trim() ? schedule.cron.trim() : '0 2 * * *',
      },
      updatedAt: new Date().toISOString(),
    }

    await fs.writeFile(CONFIG_PATH, JSON.stringify(normalized, null, 2), 'utf8')

    return NextResponse.json({ success: true, config: normalized })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
