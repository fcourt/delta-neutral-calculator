'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';

export default function DeltaNeutralCalculator() {
  const [priceShort, setPriceShort] = useState('95000');
  const [priceLong, setPriceLong] = useState('94500');
  const [capital, setCapital] = useState('10000');
  const [leverage, setLeverage] = useState('1');
  const [method, setMethod] = useState('capital');
  const [quantity, setQuantity] = useState('0.1');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [fetchStatus, setFetchStatus] = useState({ extended: 'idle', omni: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  
  const [results, setResults] = useState(null);

  useEffect(() => {
    calculatePositions();
  }, [priceShort, priceLong, capital, leverage, method, quantity]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      fetchPrices();
      interval = setInterval(fetchPrices, refreshInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchPrices = async () => {
    setIsLoading(true);
    setFetchStatus({ extended: 'loading', omni: 'loading' });
    
    try {
      // Utilise l'API backend pour contourner CORS
      const response = await fetch('/api/prices');
      const data = await response.json();
      
      if (data.extended?.success) {
        setPriceShort(data.extended.ask.toFixed(2));
        setFetchStatus(prev => ({ ...prev, extended: 'success' }));
      } else {
        setFetchStatus(prev => ({ ...prev, extended: 'error' }));
      }
      
      if (data.omni?.success) {
        setPriceLong(data.omni.bid.toFixed(2));
        setFetchStatus(prev => ({ ...prev, omni: 'success' }));
      } else {
        setFetchStatus(prev => ({ ...prev, omni: 'error' }));
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
      setFetchStatus({ extended: 'error', omni: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePositions = () => {
    const ps = parseFloat(priceShort) || 0;
    const pl = parseFloat(priceLong) || 0;
    const cap = parseFloat(capital) || 0;
    const lev = parseFloat(leverage) || 1;
    const qty = parseFloat(quantity) || 0;

    if (ps <= 0 || pl <= 0 || (method === 'capital' && cap <= 0) || (method === 'quantity' && qty <= 0) || lev <= 0) {
      setResults(null);
      return;
    }

    let shortQty, longQty, totalNotional, spread, spreadPct, pnlAt;

    if (method === 'capital') {
      const effectiveCap = cap * lev;
      const avgPrice = (ps + pl) / 2;
      shortQty = effectiveCap / (ps + pl);
      longQty = shortQty * (ps / pl);
      totalNotional = shortQty * ps;
      
      pnlAt = {
        avgPrice: avgPrice,
        shortPnl: shortQty * (ps - avgPrice),
        longPnl: longQty * (avgPrice - pl),
        totalPnl: shortQty * (ps - avgPrice) + longQty * (avgPrice - pl)
      };
    } else {
      shortQty = qty;
      longQty = (shortQty * ps) / pl;
      totalNotional = shortQty * ps;
      
      const avgPrice = (ps + pl) / 2;
      pnlAt = {
        avgPrice: avgPrice,
        shortPnl: shortQty * (ps - avgPrice),
        longPnl: longQty * (avgPrice - pl),
        totalPnl: shortQty * (ps - avgPrice) + longQty * (avgPrice - pl)
      };
    }

    spread = ps - pl;
    spreadPct = (spread / pl) * 100;

    const collateralShort = (shortQty * ps) / lev;
    const collateralLong = (longQty * pl) / lev;
    const totalCollateral = collateralShort + collateralLong;

    setResults({
      shortQty: shortQty.toFixed(6),
      longQty: longQty.toFixed(6),
      shortNotional: (shortQty * ps).toFixed(2),
      longNotional: (longQty * pl).toFixed(2),
      spread: spread.toFixed(2),
      spreadPct: spreadPct.toFixed(3),
      collateralShort: collateralShort.toFixed(2),
      collateralLong: collateralLong.toFixed(2),
      totalCollateral: totalCollateral.toFixed(2),
      pnlAt: pnlAt
    });
  };

  const StatusIndicator = ({ status }) => {
    if (status === 'loading') {
      return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    if (status === 'success') {
      return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />;
    }
    if (status === 'error') {
      return <div className="w-2 h-2 bg-red-400 rounded-full" />;
    }
    return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
  };

  const testDeltaNeutrality = () => {
    if (!results) return null;

    const ps = parseFloat(priceShort);
    const pl = parseFloat(priceLong);
    const shortQty = parseFloat(results.shortQty);
    const longQty = parseFloat(results.longQty);

    const scenarios = [
      { name: '+1%', multiplier: 1.01 },
      { name: '-1%', multiplier: 0.99 },
      { name: '+5%', multiplier: 1.05 },
      { name: '-5%', multiplier: 0.95 }
    ];

    return scenarios.map(scenario => {
      const newPs = ps * scenario.multiplier;
      const newPl = pl * scenario.multiplier;
      
      const shortPnl = shortQty * (ps - newPs);
      const longPnl = longQty * (newPl - pl);
      const totalPnl = shortPnl + longPnl;

      return {
        ...scenario,
        shortPnl: shortPnl.toFixed(2),
        longPnl: longPnl.toFixed(2),
        totalPnl: totalPnl.toFixed(2)
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Calculateur Delta Neutral</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={fetchPrices}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Chargement...' : 'Actualiser les prix'}
              </button>
              
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                Auto-refresh
              </label>
              
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10" className="bg-slate-800">10s</option>
                  <option value="30" className="bg-slate-800">30s</option>
                  <option value="60" className="bg-slate-800">60s</option>
                  <option value="120" className="bg-slate-800">2min</option>
                </select>
              )}
            </div>
          </div>

          {lastUpdate && (
            <div className="mb-4 text-center">
              <span className="text-sm text-gray-400">
                Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <StatusIndicator status={fetchStatus.extended} />
                  <span className="text-gray-300">Extended</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <StatusIndicator status={fetchStatus.omni} />
                  <span className="text-gray-300">Omni</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-2">✨ Récupération automatique des prix activée !</p>
                <p className="mb-2">Cliquez sur "Actualiser les prix" pour récupérer les prix en temps réel via notre API backend.</p>
                <p className="font-semibold mb-1">En cas d'échec de l'API :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Extended Exchange:</strong> Ouvrez <a href="https://app.extended.exchange/perp/BTC-USD" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">app.extended.exchange/perp/BTC-USD</a> et copiez le prix Ask</li>
                  <li><strong>Omni Variational:</strong> Ouvrez <a href="https://omni.variational.io/perpetual/BTC" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">omni.variational.io/perpetual/BTC</a> et copiez le prix Bid</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Inputs Section */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  Position SHORT (Extended)
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prix BTC Ask (USD) - Prix pour shorter
                  </label>
                  <input
                    type="number"
                    value={priceShort}
                    onChange={(e) => setPriceShort(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="95000"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    💡 Copiez le prix <strong>Ask</strong> depuis Extended
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Position LONG (Omni)
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prix BTC Bid (USD) - Prix pour longer
                  </label>
                  <input
                    type="number"
                    value={priceLong}
                    onChange={(e) => setPriceLong(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="94500"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    💡 Copiez le prix <strong>Bid</strong> depuis Omni
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Paramètres</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Méthode de calcul
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="capital" className="bg-slate-800">Par capital total</option>
                      <option value="quantity" className="bg-slate-800">Par quantité SHORT</option>
                    </select>
                  </div>

                  {method === 'capital' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Capital total (USD)
                      </label>
                      <input
                        type="number"
                        value={capital}
                        onChange={(e) => setCapital(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10000"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quantité SHORT (BTC)
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.1"
                        step="0.001"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Levier
                    </label>
                    <input
                      type="number"
                      value={leverage}
                      onChange={(e) => setLeverage(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {results ? (
                <>
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-400/30">
                    <h2 className="text-xl font-semibold text-white mb-4">📊 Positions Calculées</h2>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">SHORT (Extended)</span>
                        <span className="text-xl font-bold text-red-400">{results.shortQty} BTC</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">LONG (Omni)</span>
                        <span className="text-xl font-bold text-green-400">{results.longQty} BTC</span>
                      </div>

                      <div className="border-t border-white/10 pt-3 mt-3">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-400">Valeur notionnelle SHORT</span>
                          <span className="text-white font-semibold">${results.shortNotional}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Valeur notionnelle LONG</span>
                          <span className="text-white font-semibold">${results.longNotional}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">💰 Collateral Requis</h2>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Extended (SHORT)</span>
                        <span className="text-white font-semibold">${results.collateralShort}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Omni (LONG)</span>
                        <span className="text-white font-semibold">${results.collateralLong}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-xl text-blue-400 font-bold">${results.totalCollateral}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">📈 Spread</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Écart de prix</span>
                        <span className="text-white font-semibold">${results.spread}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Pourcentage</span>
                        <span className="text-yellow-400 font-semibold">{results.spreadPct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-400/30">
                    <h2 className="text-xl font-semibold text-white mb-4">🎯 PnL à convergence</h2>
                    <div className="text-sm text-gray-300 mb-3">
                      Si les prix convergent vers ${results.pnlAt.avgPrice.toFixed(2)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">PnL SHORT</span>
                        <span className="text-red-400">${results.pnlAt.shortPnl.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">PnL LONG</span>
                        <span className="text-green-400">${results.pnlAt.longPnl.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-white font-semibold">PnL Total</span>
                        <span className={`text-xl font-bold ${results.pnlAt.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${results.pnlAt.totalPnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Test de neutralité
                    </h2>
                    <div className="space-y-2 text-sm">
                      {testDeltaNeutrality()?.map((scenario, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded">
                          <span className="text-gray-300">{scenario.name}</span>
                          <span className={`font-semibold ${Math.abs(parseFloat(scenario.totalPnl)) < 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                            ${scenario.totalPnl}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
                      <div className="flex gap-2 text-xs text-blue-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Plus le PnL est proche de $0 pour chaque scénario, plus la position est delta neutre</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
                  <Calculator className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Entrez les prix et paramètres pour calculer vos positions</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-semibold mb-1">⚠️ Avertissements importants :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Vérifiez les frais de funding sur chaque plateforme</li>
                  <li>Surveillez la liquidité des orderbooks avant d'exécuter</li>
                  <li>Le slippage peut affecter vos prix d'entrée réels</li>
                  <li>Rééquilibrez si l'écart de prix change significativement</li>
                  <li>Attention aux risques de liquidation sur positions à fort levier</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
