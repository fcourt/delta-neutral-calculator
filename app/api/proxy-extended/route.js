import { NextResponse } from 'next/server';

// Utilise un proxy CORS public comme solution de secours
export async function GET() {
  try {
    // Liste de proxies CORS publics à essayer
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url=',
    ];
    
    const targetUrl = 'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD';
    
    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy + encodeURIComponent(targetUrl);
        console.log(`[Proxy] Trying: ${proxy}`);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'ok' && data.data && Array.isArray(data.data) && data.data.length > 0) {
            const stats = data.data[0].marketStats;
            
            return NextResponse.json({
              success: true,
              platform: 'Extended Exchange',
              market: 'BTC-USD',
              method: 'proxy',
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
          }
        }
      } catch (error) {
        console.error(`[Proxy] ${proxy} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All proxy attempts failed');
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      platform: 'Extended Exchange',
      error: error.message,
      hint: 'Unable to fetch via proxy. Manual entry required.',
      timestamp: Date.now()
    }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
