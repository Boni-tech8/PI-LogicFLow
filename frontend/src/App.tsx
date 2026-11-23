import { useNavigate, NavLink, Navigate, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import './App.css'

function Login() {
  const navigate = useNavigate()

  return (
    <main style={{ maxWidth: 420, margin: '80px auto', padding: 24 }}>
      <h1>Logicflow</h1>
      <p>Entre na sua conta</p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          navigate('/inicio')
        }}
      >
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          required
          placeholder="seu@email.com"
          style={{ display: 'block', width: '100%', padding: 12, margin: '8px 0 16px' }}
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          required
          placeholder="Sua senha"
          style={{ display: 'block', width: '100%', padding: 12, margin: '8px 0 16px' }}
        />

        <button type="submit" style={{ width: '100%', padding: 12 }}>
          Entrar
        </button>
      </form>
    </main>
  )
}

function NavegacaoInferior() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#2563eb' : '#555',
    textDecoration: 'none',
    padding: 12,
  })

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #ddd' }}>
      <NavLink to="/inicio" style={linkStyle}>Início</NavLink>
      <NavLink to="/demandas" style={linkStyle}>Demandas</NavLink>
    </nav>
  )
}

function PaginaInterna({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', padding: 20 }}>
      <header>
        <h1>Logicflow</h1>
      </header>
      <main>
        <h2>{titulo}</h2>
        {children}
      </main>
      <NavegacaoInferior />
    </div>
  )
}

function Inicio() {
  return (
    <PaginaInterna titulo="Início">
      <p>Bem-vindo ao Logicflow.</p>
    </PaginaInterna>
  )
}

function Demandas() {
  return (
    <PaginaInterna titulo="Demandas">
      <p>Suas demandas aparecerão aqui.</p>
    </PaginaInterna>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/demandas" element={<Demandas />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App