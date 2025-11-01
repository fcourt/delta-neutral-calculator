import { NextResponse } from 'next/server';

export async function GET() {
  const testResults = {
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  // Test avec différentes variations d'URL et headers
  const urlVariants = [
    'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD',
    'https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD/stats',
    'https://api.starknet.extended.exchange/api/v1/info/markets',
  ];

  for (const url of urlVariants) {
    const testName = `extended_${urlVariants.indexOf(url)}`;
    try {
      console.log(`Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });

      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      testResults.tests[testName] = {
        url: url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: responseHeaders,
        contentType: response.headers.get('content-type')
      };

      if (response.ok) {
        try {
          const data = await response.json();
          testResults.tests[testName].dataPreview = JSON.stringify(data).substring(0, 1000);
          testResults.tests[testName].hasData = !!data;
          testResults.tests[testName].dataStatus = data.status;
        } catch (e) {
          testResults.tests[testName].jsonError = e.message;
        }
      } else {
        const text = await response.text();
        testResults.tests[testName].errorBody = text.substring(0, 500);
      }
    } catch (error) {
      testResults.tests[testName] = {
        url: url,
        error: error.message,
        errorName: error.name,
        stack: error.stack?.substring(0, 300)
      };
    }
  }

  // Test simple avec fetch natif sans options
  try {
    testResults.tests.simple_fetch = {
      url: 'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD'
    };
    
    const simpleResponse = await fetch('https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD');
    testResults.tests.simple_fetch.status = simpleResponse.status;
    testResults.tests.simple_fetch.ok = simpleResponse.ok;
    
    if (simpleResponse.ok) {
      const data = await simpleResponse.json();
      testResults.tests.simple_fetch.success = true;
      testResults.tests.simple_fetch.dataPreview = JSON.stringify(data).substring(0, 500);
    }
  } catch (error) {
    testResults.tests.simple_fetch.error = error.message;
  }

  return NextResponse.json(testResults, { 
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
