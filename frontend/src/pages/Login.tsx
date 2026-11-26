import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <main style={{ maxWidth: 420, margin: '80px auto', padding: 24 }}>
      <h1 className="text-3xl font-bold text-blue-600">Logicflow</h1>
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
          style={{
            display: 'block',
            width: '100%',
            padding: 12,
            margin: '8px 0 16px',
          }}
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          required
          placeholder="Sua senha"
          style={{
            display: 'block',
            width: '100%',
            padding: 12,
            margin: '8px 0 16px',
          }}
        />

        <button type="submit" style={{ width: '100%', padding: 12 }}>
          Entrar
        </button>
      </form>
    </main>
  )
}