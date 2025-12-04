#!/usr/bin/env tsx
import 'dotenv/config'
import { generateAllNotifications } from '../../src/lib/notifications'

async function main() {
  try {
    console.log(`[notifications] Starting generation at ${new Date().toISOString()}`)
    await generateAllNotifications()
    console.log(`[notifications] Generation completed at ${new Date().toISOString()}`)
    process.exit(0)
  } catch (err) {
    console.error('[notifications] Generation failed:', err)
    process.exit(1)
  }
}

main()
