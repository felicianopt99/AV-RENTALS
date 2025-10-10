import { NextRequest, NextResponse } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as ServerIO } from 'socket.io'
import { realTimeSync } from '@/lib/realtime-sync'

export default function handler(req: NextRequest, res: any) {
  if (res.socket?.server?.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = realTimeSync.initialize(res.socket.server)
    res.socket.server.io = io
  }
  
  return NextResponse.json({ success: true })
}

export const config = {
  api: {
    bodyParser: false,
  },
}