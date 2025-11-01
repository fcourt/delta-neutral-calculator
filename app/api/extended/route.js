import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Extended API] Starting fetch...');
    
    // Essayons plusieurs approches
    const approaches = [
      {
        name: 'Direct fetch',
        execute: async () => {
          const url = 'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD';
          return await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            },
            cache: 'no-store'
          });
        }
      },
      {
        name: 'Stats endpoint',
        execute: async () => {
          const url = 'https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD/stats';
          return await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            },
            cache: 'no-store'
          });
        }
      },
      {
        name: 'Simple fetch',
        execute: async () => {
          return await fetch('https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD');
        }
      }
    ];

    let lastError = null;
    
    for (const approach of approaches) {
      try {
        console.log(`[Extended API] Trying: ${approach.name}`);
        const response = await approach.execute();
        
        console.log(`[Extended API] ${approach.name} - Status:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[Extended API] ${approach.name} - Success`);
          
          // Adapter selon la structure de réponse
          let stats;
          
          if (data.status === 'ok' || data.status === 'OK') {
            if (Array.isArray(data.data) && data.data.length > 0) {
              // Format: /markets endpoint
              stats = data.data[0].marketStats;
            } else if (data.data && typeof data.data === 'object') {
              // Format: /stats endpoint
              stats = data.data;
            }
          }
          
          if (stats && stats.bidPrice && stats.askPrice) {
            return NextResponse.json({
              success: true,
              platform: 'Extended Exchange',
              market: 'BTC-USD',
              method: approach.name,
              data: {
                bid: parseFloat(stats.bidPrice),
                ask: parseFloat(stats.askPrice),
                mid: (parseFloat(stats.bidPrice) + parseFloat(stats.askPrice)) / 2,
                last: parseFloat(stats.lastPrice),
                mark: parseFloat(stats.markPrice || stats.bidPrice),
                index: parseFloat(stats.indexPrice || stats.bidPrice),
                volume24h: parseFloat(stats.dailyVolume || 0),
                change24h: parseFloat(stats.dailyPriceChangePercentage || 0)
              },
              timestamp: Date.now()
            });
          }
        }
        
        lastError = `${approach.name}: HTTP ${response.status}`;
      } catch (error) {
        console.error(`[Extended API] ${approach.name} failed:`, error.message);
        lastError = `${approach.name}: ${error.message}`;
      }
    }
    
    throw new Error(`All approaches failed. Last error: ${lastError}`);
    
  } catch (error) {
    console.error('[Extended API] All attempts failed:', error);
    return NextResponse.json({
      success: false,
      platform: 'Extended Exchange',
      error: error.message,
      hint: 'Extended API may be blocking requests from Vercel. Try entering prices manually.',
      timestamp: Date.now()
    }, { status: 503 });
  }
}

// Configuration pour forcer le comportement dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;
