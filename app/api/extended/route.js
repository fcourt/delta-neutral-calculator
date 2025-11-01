import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Extended API] Starting fetch...');
    
    // URL correcte avec le paramètre market
    const url = 'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    console.log('[Extended API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Extended API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Extended API] Data received:', JSON.stringify(data).substring(0, 500));

    if (data.status === 'ok' && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const marketData = data.data[0];
      const stats = marketData.marketStats;
      
      return NextResponse.json({
        success: true,
        platform: 'Extended Exchange',
        market: 'BTC-USD',
        data: {
          bid: parseFloat(stats.bidPrice),
          ask: parseFloat(stats.askPrice),
          mid: (parseFloat(stats.bidPrice) + parseFloat(stats.askPrice)) / 2,
          last: parseFloat(stats.lastPrice),
          mark: parseFloat(stats.markPrice),
          index: parseFloat(stats.indexPrice),
          volume24h: parseFloat(stats.dailyVolume),
          change24h: parseFloat(stats.dailyPriceChangePercentage)
        },
        timestamp: Date.now()
      });
    } else {
      throw new Error(`Invalid data structure: ${JSON.stringify(data).substring(0, 500)}`);
    }
  } catch (error) {
    console.error('[Extended API] Error:', error);
    return NextResponse.json({
      success: false,
      platform: 'Extended Exchange',
      error: error.message,
      details: error.stack?.substring(0, 500),
      timestamp: Date.now()
    }, { status: 500 });
  }
}

// Configuration pour forcer le comportement dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;
