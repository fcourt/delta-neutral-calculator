// API Route pour récupérer le prix depuis Extended Exchange
export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const response = await fetch('https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Extended API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ok' && data.data && data.data[0]) {
      const stats = data.data[0].marketStats;
      
      res.status(200).json({
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
    res.status(500).json({
      success: false,
      platform: 'Extended Exchange',
      error: error.message,
      timestamp: Date.now()
    });
  }
}
