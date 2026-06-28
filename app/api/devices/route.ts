import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    // Optional Security Handshake
    const kioskApiKey = process.env.KIOSK_API_KEY;
    if (kioskApiKey) {
      const clientKey = request.headers.get('x-kiosk-key') || request.headers.get('x-api-key');
      if (clientKey !== kioskApiKey) {
        return NextResponse.json({ error: 'Unauthorized: Invalid security handshake token' }, { status: 401 });
      }
    }

    const body = await request.json();

    // Allowed columns to update in the unified 'my_room' row
    const allowedKeys = ['light', 'fan', 'rgb', 'neon', 'decor', 'neon_color', 'ac_cmd', 'temperature', 'humidity'];
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('devices')
      .update(updateData)
      .eq('id', 'my_room')
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (err: any) {
    console.error("Device secure update failure:", err);
    return NextResponse.json({ error: err.message || 'Internal database write failure' }, { status: 500 });
  }
}
