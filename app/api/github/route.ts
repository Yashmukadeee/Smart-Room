import { NextResponse } from 'next/server';

// Server-side proxy for GitHub API calls
// This prevents the GitHub token from being exposed in the client-side bundle
// The token is stored as GITHUB_TOKEN (not NEXT_PUBLIC_) so Next.js keeps it server-only

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner');
    const repo = url.searchParams.get('repo');

    if (!owner) {
      return NextResponse.json({ error: 'Missing owner parameter' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token || token.startsWith('YOUR_')) {
      // Return empty array in demo/zero-config mode
      return NextResponse.json({ events: [], demo: true });
    }

    // Sanitize input: only allow alphanumeric, hyphens, underscores, and dots
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '');
    const safeOwner = sanitize(owner);
    const safeRepo = repo ? sanitize(repo) : null;

    const fullName = safeRepo ? `${safeOwner}/${safeRepo}` : safeOwner;

    const res = await fetch(`https://api.github.com/repos/${fullName}/events?per_page=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      // Cache for 60 seconds to avoid GitHub rate limits
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('GitHub API error:', res.status, errText);
      return NextResponse.json({ events: [], error: `GitHub returned ${res.status}` });
    }

    const events = await res.json();
    return NextResponse.json({ events: events.slice(0, 10) });
  } catch (err: any) {
    console.error('GitHub proxy error:', err);
    return NextResponse.json({ events: [], error: err.message }, { status: 500 });
  }
}
