import './globals.css';

export const metadata = {
  title: 'AI Stock Signal Dashboard',
  description: 'AI-powered stock analysis and sentiment dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
