import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
        'Accept': 'application/json'
      },
      cache: 'no-store' // Force fresh data
    });

    if (!response.ok) {
      throw new Error(`Extended API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ok' && data.data && data.data[0]) {
      const stats = data.data[0].marketStats;
      
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
      throw new Error('Invalid data structure from Extended API');
    }
  } catch (error) {
    console.error('Extended API Error:', error);
    return NextResponse.json({
      success: false,
      platform: 'Extended Exchange',
      error: error.message,
      timestamp: Date.now()
    }, { status: 500 });
  }
}

// Configuration pour forcer le comportement dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;
