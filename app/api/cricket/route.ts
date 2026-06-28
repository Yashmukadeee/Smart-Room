import { NextResponse } from 'next/server';

// Server-side proxy for CricAPI — returns ALL live matches + highlights MI
// Keeps the API key server-only (CRICAPI_KEY)

export interface LiveMatch {
  id: string;
  name: string;
  matchType: string; // 'T20' | 'ODI' | 'Test'
  status: string;
  venue: string;
  teams: string[];
  score: { inning: string; runs: number; wickets: number; overs: string }[];
  isMI: boolean;
  dateTimeGMT: string;
}

// Realistic demo data with multiple matches
const DEMO_MATCHES: LiveMatch[] = [
  {
    id: 'demo-1',
    name: 'Mumbai Indians vs Chennai Super Kings',
    matchType: 'T20',
    status: 'Mumbai Indians need 2 runs in 8 balls',
    venue: 'Wankhede Stadium, Mumbai',
    teams: ['Mumbai Indians', 'Chennai Super Kings'],
    score: [
      { inning: 'Chennai Super Kings', runs: 180, wickets: 7, overs: '20.0' },
      { inning: 'Mumbai Indians', runs: 179, wickets: 3, overs: '18.4' },
    ],
    isMI: true,
    dateTimeGMT: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'India vs Australia, 3rd Test',
    matchType: 'Test',
    status: 'Day 3 - India lead by 142 runs',
    venue: 'MCG, Melbourne',
    teams: ['India', 'Australia'],
    score: [
      { inning: 'Australia 1st Innings', runs: 263, wickets: 10, overs: '78.2' },
      { inning: 'India 1st Innings', runs: 367, wickets: 10, overs: '98.4' },
      { inning: 'Australia 2nd Innings', runs: 38, wickets: 1, overs: '14.0' },
    ],
    isMI: false,
    dateTimeGMT: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Royal Challengers vs Gujarat Titans',
    matchType: 'T20',
    status: 'Gujarat Titans chose to bat',
    venue: 'M Chinnaswamy Stadium, Bengaluru',
    teams: ['Royal Challengers Bengaluru', 'Gujarat Titans'],
    score: [
      { inning: 'Gujarat Titans', runs: 94, wickets: 3, overs: '12.2' },
    ],
    isMI: false,
    dateTimeGMT: new Date().toISOString(),
  },
];


function isIplOrIndiaMatch(match: any): boolean {
  const name = (match.name || '').toLowerCase();
  const teams = (match.teams || []).map((t: string) => t.toLowerCase());

  const iplKeywords = [
    'mumbai', 'chennai', 'royal challengers', 'kolkata', 'delhi capitals',
    'punjab kings', 'sunrisers', 'rajasthan', 'gujarat titans', 'lucknow super'
  ];
  
  const iplShorts = ['mi', 'csk', 'rcb', 'kkr', 'dc', 'pbks', 'srh', 'rr', 'gt', 'lsg'];

  const hasIplTeam = teams.some((team: string) => 
    iplKeywords.some(kw => team.includes(kw)) || iplShorts.includes(team)
  );

  const hasIplTeamInfo = (match.teamInfo || []).some((t: any) => {
    const short = (t.shortname || '').toLowerCase();
    const tName = (t.name || '').toLowerCase();
    return iplShorts.includes(short) || iplKeywords.some(kw => tName.includes(kw));
  });

  const isIPL = name.includes('ipl') || name.includes('indian premier league') || hasIplTeam || hasIplTeamInfo;

  const hasIndiaTeam = teams.some((team: string) => 
    team === 'india' || team.startsWith('india ') || team.includes(' india')
  );

  const hasIndiaTeamInfo = (match.teamInfo || []).some((t: any) => {
    const short = (t.shortname || '').toLowerCase();
    const tName = (t.name || '').toLowerCase();
    return short === 'ind' || tName === 'india' || tName.startsWith('india ') || tName.includes(' india');
  });

  const isIndia = name.includes('india') || hasIndiaTeam || hasIndiaTeamInfo;

  return isIPL || isIndia;
}

export async function GET() {
  try {
    const apiKey = process.env.CRICAPI_KEY;

    if (!apiKey || apiKey.startsWith('YOUR_')) {
      // Demo mode — always return demo matches for development
      const filteredDemo = DEMO_MATCHES.filter(isIplOrIndiaMatch);
      return NextResponse.json({
        demo: true,
        matches: filteredDemo,
        miMatch: filteredDemo.find(m => m.isMI) ?? null,
      });
    }

    // Real API call — server only
    const res = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ matches: [], miMatch: null, error: `CricAPI returned ${res.status}` });
    }

    const data = await res.json();
    if (!data?.data) {
      return NextResponse.json({ matches: [], miMatch: null });
    }

    const liveMatches: LiveMatch[] = [];
    let miMatch: LiveMatch | null = null;

    for (const match of data.data) {
      if (!match.matchStarted) continue;
      if (!isIplOrIndiaMatch(match)) continue;

      const isMI = !!(
        match.teams?.some((t: string) => t.toLowerCase().includes('mumbai')) ||
        match.teamInfo?.some((t: any) => t.shortname?.toLowerCase() === 'mi')
      );

      const scoreArr = (match.score || []).map((s: any) => ({
        inning: s.inning || '',
        runs: s.r ?? 0,
        wickets: s.w ?? 0,
        overs: String(s.o ?? '0'),
      }));

      const matchObj: LiveMatch = {
        id: match.id || `m-${Math.random().toString(36).slice(2)}`,
        name: match.name || 'Cricket Match',
        matchType: (match.matchType || 'T20').toUpperCase(),
        status: match.status || 'In Progress',
        venue: match.venue || '',
        teams: match.teams || [],
        score: scoreArr,
        isMI,
        dateTimeGMT: match.dateTimeGMT || new Date().toISOString(),
      };

      liveMatches.push(matchObj);

      if (isMI && !match.matchEnded) {
        miMatch = matchObj;
      }
    }

    // Sort: MI first, then by recency
    liveMatches.sort((a, b) => {
      if (a.isMI && !b.isMI) return -1;
      if (!a.isMI && b.isMI) return 1;
      return new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime();
    });

    return NextResponse.json({
      matches: liveMatches.slice(0, 8),
      miMatch,
    });
  } catch (err: any) {
    console.error('CricAPI proxy error:', err);
    return NextResponse.json({ matches: [], miMatch: null, error: err.message }, { status: 500 });
  }
}
