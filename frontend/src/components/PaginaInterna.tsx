import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

type Props = {
  titulo: string
  children: ReactNode
}

export default function PaginaInterna({ titulo, children }: Props) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', padding: 20 }}>
      <header>
        <h1>Logicflow</h1>
      </header>

      <main>
        <h2>{titulo}</h2>
        {children}
      </main>

      <BottomNav />
    </div>
  )
}