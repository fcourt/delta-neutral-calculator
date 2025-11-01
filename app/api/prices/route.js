// API Route pour récupérer les deux prix en une seule requête
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

  const results = {
    extended: null,
    omni: null,
    timestamp: Date.now()
  };

  // Récupérer Extended Exchange
  try {
    const extendedResponse = await fetch('https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
        'Accept': 'application/json'
      }
    });

    if (extendedResponse.ok) {
      const data = await extendedResponse.json();
      if (data.status === 'ok' && data.data && data.data[0]) {
        const stats = data.data[0].marketStats;
        results.extended = {
          success: true,
          bid: parseFloat(stats.bidPrice),
          ask: parseFloat(stats.askPrice),
          mid: (parseFloat(stats.bidPrice) + parseFloat(stats.askPrice)) / 2,
          last: parseFloat(stats.lastPrice),
          mark: parseFloat(stats.markPrice),
          volume24h: parseFloat(stats.dailyVolume),
          change24h: parseFloat(stats.dailyPriceChangePercentage)
        };
      }
    }
  } catch (error) {
    results.extended = {
      success: false,
      error: error.message
    };
  }

  // Récupérer Omni Variational
  const omniEndpoints = [
    'https://omni.variational.io/api/v1/markets/BTC-USD',
    'https://api.variational.io/perpetual/BTC/price',
    'https://omni.variational.io/api/markets/BTC-USD'
  ];

  for (const endpoint of omniEndpoints) {
    try {
      const omniResponse = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (omniResponse.ok) {
        const data = await omniResponse.json();
        let price = null;
        let bid = null;
        let ask = null;

        if (data.price) price = parseFloat(data.price);
        else if (data.bid && data.ask) {
          bid = parseFloat(data.bid);
          ask = parseFloat(data.ask);
          price = (bid + ask) / 2;
        } else if (data.data?.price) price = parseFloat(data.data.price);
        else if (data.data?.bid && data.data?.ask) {
          bid = parseFloat(data.data.bid);
          ask = parseFloat(data.data.ask);
          price = (bid + ask) / 2;
        }

        if (price && price > 0) {
          if (!bid || !ask) {
            bid = price * 0.9995;
            ask = price * 1.0005;
          }

          results.omni = {
            success: true,
            bid: bid,
            ask: ask,
            mid: price,
            last: price,
            source: endpoint
          };
          break;
        }
      }
    } catch (error) {
      // Continue avec le prochain endpoint
    }
  }

  if (!results.omni) {
    results.omni = {
      success: false,
      error: 'Unable to fetch price from Omni API'
    };
  }

  // Calculer le spread si les deux sont disponibles
  if (results.extended?.success && results.omni?.success) {
    results.spread = {
      absolute: results.extended.ask - results.omni.bid,
      percentage: ((results.extended.ask - results.omni.bid) / results.omni.bid * 100).toFixed(3)
    };
  }

  res.status(200).json(results);
}
