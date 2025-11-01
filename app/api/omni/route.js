import { NextResponse } from 'next/server';

export async function GET() {
  const omniEndpoints = [
    'https://omni.variational.io/api/v1/markets/BTC-USD',
    'https://api.variational.io/perpetual/BTC/price',
    'https://omni.variational.io/api/markets/BTC-USD',
    'https://api.variational.io/v1/markets/BTC-USD',
    'https://omni.variational.io/api/price/BTC'
  ];

  for (const endpoint of omniEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
          'Accept': 'application/json'
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        
        let price = null;
        let bid = null;
        let ask = null;

        if (data.price) {
          price = parseFloat(data.price);
        } else if (data.bid && data.ask) {
          bid = parseFloat(data.bid);
          ask = parseFloat(data.ask);
          price = (bid + ask) / 2;
        } else if (data.data?.price) {
          price = parseFloat(data.data.price);
        } else if (data.data?.bid && data.data?.ask) {
          bid = parseFloat(data.data.bid);
          ask = parseFloat(data.data.ask);
          price = (bid + ask) / 2;
        }

        if (price && price > 0) {
          if (!bid || !ask) {
            bid = price * 0.9995;
            ask = price * 1.0005;
          }

          return NextResponse.json({
            success: true,
            platform: 'Omni Variational',
            market: 'BTC-USD',
            data: {
              bid: bid,
              ask: ask,
              mid: price,
              last: price
            },
            source: endpoint,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error.message);
    }
  }

  return NextResponse.json({
    success: false,
    platform: 'Omni Variational',
    error: 'Unable to fetch price from Omni API. Please check manually.',
    timestamp: Date.now(),
    hint: 'API may require authentication or may not be publicly accessible'
  }, { status: 503 });
}

// Configuration pour forcer le comportement dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;
