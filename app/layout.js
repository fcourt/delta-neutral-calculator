import './globals.css'

export const metadata = {
  title: 'Delta Neutral Calculator - BTC/USD',
  description: 'Calculateur pour stratégie delta neutral sur Extended Exchange et Omni Variational',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
