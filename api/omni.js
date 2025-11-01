// API Route pour récupérer le prix depuis Omni Variational
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

  // Liste d'endpoints possibles à essayer
  const endpoints = [
    'https://omni.variational.io/api/v1/markets/BTC-USD',
    'https://api.variational.io/perpetual/BTC/price',
    'https://omni.variational.io/api/markets/BTC-USD',
    'https://api.variational.io/v1/markets/BTC-USD',
    'https://omni.variational.io/api/price/BTC'
  ];

  // Tentative avec chaque endpoint
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeltaNeutralCalculator/1.0)',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        
        // Essayer de parser différentes structures de réponse possibles
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
          // Estimation du bid/ask si pas fourni (spread typique de 0.1%)
          if (!bid || !ask) {
            bid = price * 0.9995;
            ask = price * 1.0005;
          }

          res.status(200).json({
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
          return;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error.message);
      // Continue avec le prochain endpoint
    }
  }

  // Si aucun endpoint n'a fonctionné
  res.status(503).json({
    success: false,
    platform: 'Omni Variational',
    error: 'Unable to fetch price from Omni API. Please check manually at https://omni.variational.io/perpetual/BTC',
    timestamp: Date.now(),
    hint: 'API may require authentication or may not be publicly accessible'
  });
}
