import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Helper function to authenticate incoming requests from ESP32
function isAuthorized(request: Request) {
  const esp32ApiKey = process.env.ESP32_API_KEY;
  if (!esp32ApiKey) {
    return true; // Zero-config mode: allow requests if key is not configured in .env.local
  }

  // Check headers or URL query parameter
  const headerKey = request.headers.get('x-esp32-key') || request.headers.get('x-api-key');
  if (headerKey === esp32ApiKey) return true;

  const url = new URL(request.url);
  const queryKey = url.searchParams.get('token') || url.searchParams.get('key');
  if (queryKey === esp32ApiKey) return true;

  return false;
}

// ESP32 makes a GET request here to fetch all current pin states
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid ESP32 API Key' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('id, status, value');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Returns easy JSON array for ESP32 ArduinoJson library to parse
  return NextResponse.json({ devices: data });
}

// ESP32 makes a POST request here if physical push button is pressed in the room
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid ESP32 API Key' }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing device ID parameter' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('devices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, updated: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database write failure' }, { status: 400 });
  }
}
