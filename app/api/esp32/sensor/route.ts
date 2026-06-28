import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Helper function to authenticate incoming requests from ESP32
function isAuthorized(request: Request) {
  const esp32ApiKey = process.env.ESP32_API_KEY;
  if (!esp32ApiKey) {
    return true; // Zero-config mode: allow requests if key is not configured in .env.local
  }

  const headerKey = request.headers.get('x-esp32-key') || request.headers.get('x-api-key');
  if (headerKey === esp32ApiKey) return true;

  const url = new URL(request.url);
  const queryKey = url.searchParams.get('token') || url.searchParams.get('key');
  if (queryKey === esp32ApiKey) return true;

  return false;
}

// POST endpoint for ESP32 to publish DHT11 climate readings (temp/humidity)
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid ESP32 API Key' }, { status: 401 });
  }

  try {
    const { temp_c, humidity, device_id } = await request.json();

    if (temp_c === undefined || humidity === undefined) {
      return NextResponse.json({ error: 'Missing temp_c or humidity parameter' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sensor_log')
      .insert([
        { 
          device_id: device_id || 'esp32_dht11', 
          temp_c, 
          humidity, 
          recorded_at: new Date().toISOString() 
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, inserted: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database write failure' }, { status: 400 });
  }
}
