import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string' || pin.length !== 6) {
      return NextResponse.json({ error: 'PIN must be a 6-digit code' }, { status: 400 });
    }

    // 1. Calculate SHA-256 hash of the PIN
    const pinHash = createHash('sha256').update(pin).digest('hex');

    // 2. Query room_users to find the associated user_id
    const { data: mapping, error: mapError } = await supabaseAdmin
      .from('room_users')
      .select('user_id')
      .eq('pin_hash', pinHash)
      .maybeSingle();

    if (mapError) {
      console.error('Error looking up PIN mapping:', mapError);
      return NextResponse.json({ error: 'Database lookup error' }, { status: 500 });
    }

    if (!mapping) {
      return NextResponse.json({ error: 'Invalid PIN code' }, { status: 401 });
    }

    // 3. Get user details from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(mapping.user_id);
    
    if (userError || !userData?.user?.email) {
      console.error('Error retrieving user by ID:', userError);
      return NextResponse.json({ error: 'User mapping resolved to invalid account' }, { status: 401 });
    }

    const email = userData.user.email;

    // 4. Generate direct magic link properties (to extract the OTP token)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });

    if (linkError || !linkData?.properties?.email_otp) {
      console.error('Error generating login link:', linkError);
      return NextResponse.json({ error: 'Failed to generate authentication token' }, { status: 500 });
    }

    const emailOtp = linkData.properties.email_otp;

    // 5. Verify the OTP on the server context to write session cookies automatically
    const supabase = createClient();
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: 'email'
    });

    if (verifyError || !verifyData?.session) {
      console.error('Server OTP verification failed:', verifyError);
      return NextResponse.json({ error: 'Failed to establish secure session cookies' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PIN Authentication crash:', err);
    return NextResponse.json({ error: err.message || 'Internal server authentication failure' }, { status: 500 });
  }
}
