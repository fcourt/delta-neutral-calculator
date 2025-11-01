import { NextResponse } from 'next/server';

export async function GET() {
  const testResults = {
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  // Test 1: Connexion basique à Extended
  try {
    const response = await fetch('https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    testResults.tests.extended = {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      contentType: response.headers.get('content-type')
    };

    if (response.ok) {
      const data = await response.json();
      testResults.tests.extended.dataStructure = {
        hasStatus: !!data.status,
        statusValue: data.status,
        hasData: !!data.data,
        dataIsArray: Array.isArray(data.data),
        dataLength: data.data?.length,
        firstItemKeys: data.data?.[0] ? Object.keys(data.data[0]) : null,
        marketStatsKeys: data.data?.[0]?.marketStats ? Object.keys(data.data[0].marketStats) : null
      };
      
      // Essayer de parser les prix
      if (data.data?.[0]?.marketStats) {
        testResults.tests.extended.prices = {
          bid: data.data[0].marketStats.bidPrice,
          ask: data.data[0].marketStats.askPrice,
          last: data.data[0].marketStats.lastPrice
        };
      }
    } else {
      const text = await response.text();
      testResults.tests.extended.errorBody = text.substring(0, 500);
    }
  } catch (error) {
    testResults.tests.extended = {
      error: error.message,
      stack: error.stack?.substring(0, 500)
    };
  }

  // Test 2: Vérifier les variables d'environnement
  testResults.environment = {
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    hasCustomConfig: !!process.env.NEXT_PUBLIC_API_URL
  };

  return NextResponse.json(testResults, { 
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
