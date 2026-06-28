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

    const { id, status, color, value } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing device ID parameter' }, { status: 400 });
    }

    // Build the dynamic update payload
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (status !== undefined) updateData.status = status;
    if (color !== undefined) updateData.color = color;
    if (value !== undefined) updateData.value = value;

    const { data, error } = await supabaseAdmin
      .from('devices')
      .update(updateData)
      .eq('id', id)
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
