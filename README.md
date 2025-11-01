# Delta Neutral Calculator

Calculateur pour stratégie delta neutral sur la paire BTC-USD entre Extended Exchange et Omni Variational avec **récupération automatique des prix en temps réel**.

## ✨ Nouvelles fonctionnalités

- ✅ **Récupération automatique des prix** via API backend
- ✅ **Auto-refresh configurable** (10s, 30s, 1min, 2min)
- ✅ **Indicateurs de statut** en temps réel
- ✅ **Fallback manuel** si l'API échoue

## 🚀 Déploiement sur Vercel

### Prérequis
- Un compte GitHub
- Un compte Vercel (gratuit)

### Étapes de déploiement

1. **Créer un dépôt GitHub**
   - Allez sur https://github.com/new
   - Nommez votre repo: `delta-neutral-calculator`
   - Créez le dépôt (public ou privé)

2. **Uploader les fichiers**
   - Clonez votre repo ou utilisez GitHub Desktop
   - Copiez tous les fichiers du projet dans le dossier
   - Committez et poussez les changements

3. **Déployer sur Vercel**
   - Allez sur https://vercel.com
   - Cliquez sur "Add New" > "Project"
   - Importez votre repo GitHub
   - Vercel détectera automatiquement Next.js
   - Cliquez sur "Deploy"

Votre application sera live en quelques minutes avec l'API backend activée ! 🎉

## 📦 Structure du projet

```
delta-neutral-calculator/
├── api/
│   ├── extended.js      # API pour Extended Exchange
│   ├── omni.js          # API pour Omni Variational
│   └── prices.js        # API combinée (les deux prix)
├── app/
│   ├── page.js          # Composant principal
│   ├── layout.js        # Layout Next.js
│   └── globals.css      # Styles Tailwind
├── package.json         # Dépendances
├── next.config.js       # Config Next.js
├── tailwind.config.js   # Config Tailwind
├── postcss.config.js    # Config PostCSS
└── .gitignore          # Fichiers à ignorer
```

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Ouvrir http://localhost:3000
```

## 📖 Utilisation

### Mode automatique (recommandé)
1. Cliquez sur "Actualiser les prix"
2. Les prix se mettent à jour automatiquement
3. Activez "Auto-refresh" pour un suivi continu
4. Configurez votre capital ou quantité
5. Le calculateur affiche vos positions delta neutral

### Mode manuel (fallback)
Si l'API échoue :
1. Ouvrez Extended Exchange pour obtenir le prix Ask (SHORT)
2. Ouvrez Omni Variational pour obtenir le prix Bid (LONG)
3. Entrez les prix manuellement

## 🔧 API Backend

### Endpoints disponibles

- `GET /api/extended` - Prix depuis Extended Exchange
- `GET /api/omni` - Prix depuis Omni Variational
- `GET /api/prices` - Les deux prix + calcul du spread

### Exemple de réponse `/api/prices`

```json
{
  "extended": {
    "success": true,
    "bid": 94500.00,
    "ask": 94520.00,
    "mid": 94510.00,
    "last": 94515.00
  },
  "omni": {
    "success": true,
    "bid": 94480.00,
    "ask": 94500.00,
    "mid": 94490.00
  },
  "spread": {
    "absolute": 40.00,
    "percentage": "0.042"
  },
  "timestamp": 1699564800000
}
```

## ⚠️ Avertissements

- Vérifiez toujours les frais de funding
- Surveillez la liquidité des orderbooks
- Le slippage peut affecter vos entrées
- Rééquilibrez si nécessaire
- Attention aux risques de liquidation

## 📝 License

MIT
