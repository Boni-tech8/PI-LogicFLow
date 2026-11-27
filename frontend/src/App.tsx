
import { useState } from 'react'
import {
  useNavigate,
  NavLink,
  Navigate,
  Routes,
  Route,
} from 'react-router-dom'
import type { ReactNode, FormEvent } from 'react'

import './App.css'

import CadastroConfeccao from './components/pages/CadastroConfeccao'
import CadastroUsuario from './components/pages/CadastroUsuario'
import CadastroFaccao from './components/pages/CadastroFaccao'
import MinhasDemandas from './components/pages/MinhasDemandas'
import PublicarDemanda from './components/pages/PublicarDemanda'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(false)

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('/inicio')
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          max-width: 100%;
        }

        body {
          overflow-x: hidden;
        }

        .login-page {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          overflow: hidden;
          background: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .login-banner {
          min-width: 0;
          min-height: 100vh;
          padding: clamp(28px, 5vw, 70px);
          background: linear-gradient(145deg, #07142f, #020817);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .banner-content {
          width: 100%;
          max-width: 560px;
          min-width: 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 32px;
        }

        .brand-icon {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1760f5;
          border-radius: 17px;
          font-size: 32px;
          font-weight: bold;
        }

        .brand-name {
          font-size: clamp(23px, 3vw, 31px);
          font-weight: bold;
          white-space: nowrap;
        }

        .brand-name span {
          color: #4c9dff;
        }

        .banner-tag {
          display: inline-block;
          max-width: 100%;
          padding: 12px 20px;
          border: 1px solid #244d88;
          border-radius: 40px;
          color: #76baff;
          background: rgba(20, 61, 119, 0.35);
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
          line-height: 1.5;
        }

        .banner-title {
          margin: 42px 0 28px;
          font-size: clamp(34px, 5vw, 62px);
          line-height: 1.16;
          font-weight: 800;
          letter-spacing: -1.5px;
          overflow-wrap: anywhere;
        }

        .banner-title span {
          color: #4c9dff;
        }

        .banner-description {
          max-width: 480px;
          color: #a9c3e6;
          font-size: clamp(16px, 2vw, 21px);
          line-height: 1.75;
          margin: 0;
        }

        .login-form-side {
          min-width: 0;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: clamp(24px, 5vw, 70px);
          background: #ffffff;
        }

        .login-form-container {
          width: 100%;
          max-width: 440px;
          min-width: 0;
        }

        .form-eyebrow {
          color: #1760f5;
          font-weight: bold;
          font-size: 14px;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }

        .form-title {
          color: #101828;
          font-size: clamp(30px, 4vw, 42px);
          margin: 0 0 12px;
          line-height: 1.2;
        }

        .form-subtitle {
          color: #667085;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 35px;
        }

        .login-label {
          display: block;
          color: #24324a;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .login-input {
          display: block;
          width: 100%;
          min-width: 0;
          height: 56px;
          padding: 0 16px;
          margin-bottom: 25px;
          border: 1px solid #dce3ed;
          border-radius: 13px;
          outline: none;
          font-size: 15px;
          background: #f9fafb;
          color: #101828;
        }

        .login-input:focus {
          border-color: #1760f5;
          box-shadow: 0 0 0 3px rgba(23, 96, 245, 0.12);
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper .login-input {
          padding-right: 85px;
        }

        .show-password {
          position: absolute;
          right: 14px;
          top: 17px;
          border: none;
          background: transparent;
          color: #1760f5;
          cursor: pointer;
          font-weight: bold;
        }

        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 2px 0 28px;
          font-size: 14px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #475467;
          cursor: pointer;
        }

        .remember-label input {
          width: 18px;
          height: 18px;
          accent-color: #1760f5;
        }

        .forgot-button {
          border: none;
          background: transparent;
          color: #1760f5;
          font-weight: bold;
          cursor: pointer;
          padding: 0;
        }

        .login-button {
          width: 100%;
          min-height: 56px;
          border: none;
          border-radius: 13px;
          background: #1760f5;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .login-button:hover {
          background: #104dcc;
        }

        .signup-text {
          margin-top: 28px;
          text-align: center;
          color: #667085;
          font-size: 14px;
        }

        .signup-link {
          color: #1760f5;
          font-weight: bold;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .login-page {
            grid-template-columns: minmax(0, 1fr);
          }

          .login-banner {
            min-height: auto;
            padding: 32px 24px;
          }

          .banner-content {
            max-width: 560px;
          }

          .brand {
            margin-bottom: 22px;
          }

          .brand-icon {
            width: 48px;
            height: 48px;
            font-size: 26px;
          }

          .banner-title {
            margin: 25px 0 15px;
            font-size: clamp(32px, 8vw, 44px);
          }

          .banner-description {
            font-size: 16px;
            line-height: 1.6;
          }

          .login-form-side {
            min-height: auto;
            padding: 42px 24px;
          }
        }

        @media (max-width: 380px) {
          .login-options {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="login-page">
        <section className="login-banner">
          <div className="banner-content">
            <div className="brand">
              <div className="brand-icon">L</div>
              <div className="brand-name">
                Logic<span>Flow</span>
              </div>
            </div>

            <div className="banner-tag">
              PLATAFORMA DE CONEXÃO TÊXTIL
            </div>

            <h1 className="banner-title">
              Conectando negócios.
              <br />
              <span>Transformando oportunidades.</span>
            </h1>

            <p className="banner-description">
              Aproximamos confecções e facções, facilitando parcerias,
              oportunidades e o desenvolvimento do Polo de Confecções
              do Agreste Pernambucano.
            </p>
          </div>
        </section>

        <section className="login-form-side">
          <div className="login-form-container">
            <div className="form-eyebrow">BEM-VINDO AO LOGICFLOW</div>

            <h2 className="form-title">Faça seu login</h2>

            <p className="form-subtitle">
              Acesse sua conta e encontre novas oportunidades
              para o seu negócio.
            </p>

            <form onSubmit={handleLogin}>
              <label className="login-label" htmlFor="email">
                E-mail
              </label>

              <input
                className="login-input"
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="login-label" htmlFor="senha">
                Senha
              </label>

              <div className="password-wrapper">
                <input
                  className="login-input"
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />

                <button
                  className="show-password"
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="login-options">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                  />
                  Lembrar de mim
                </label>

                <button
                  className="forgot-button"
                  type="button"
                  onClick={() =>
                    alert('A recuperação de senha será implementada.')
                  }
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button className="login-button" type="submit">
                Entrar
              </button>
            </form>

            <p className="signup-text">
              Ainda não tem uma conta?{' '}
              <NavLink className="signup-link" to="/cadastro-usuario">
                Cadastre-se
              </NavLink>
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

function NavegacaoInferior() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#2563eb' : '#555',
    textDecoration: 'none',
    padding: 12,
  })

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid #ddd',
      }}
    >
      <NavLink to="/inicio" style={linkStyle}>
        Início
      </NavLink>

      <NavLink to="/demandas" style={linkStyle}>
        Demandas
      </NavLink>
    </nav>
  )
}

function PaginaInterna({
  titulo,
  children,
}: {
  titulo: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        minHeight: '100vh',
        padding: 20,
      }}
    >
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
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState("Todas");

  const demandas = [
    {
      id: 1,
      titulo: "Costura de camisetas",
      descricao: "Produção de camisetas básicas em malha.",
      quantidade: "500 peças",
      cidade: "Santa Cruz do Capibaribe",
      categoria: "Costura",
      status: "Aberta",
    },
    {
      id: 2,
      titulo: "Acabamento de peças",
      descricao: "Serviço de revisão e acabamento de roupas.",
      quantidade: "300 peças",
      cidade: "Toritama",
      categoria: "Acabamento",
      status: "Aberta",
    },
    {
      id: 3,
      titulo: "Produção de bermudas",
      descricao: "Confecção de bermudas masculinas.",
      quantidade: "200 peças",
      cidade: "Caruaru",
      categoria: "Costura",
      status: "Negociando",
    },
  ];

  const demandasFiltradas = demandas.filter((demanda) => {
    const correspondePesquisa =
      demanda.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
      demanda.cidade.toLowerCase().includes(pesquisa.toLowerCase());

    const correspondeFiltro =
      filtro === "Todas" || demanda.status === filtro;

    return correspondePesquisa && correspondeFiltro;
  });

  return (
    <PaginaInterna titulo="Demandas">
      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Demandas disponíveis
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Encontre oportunidades de produção na região.
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/publicar-demanda"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            + Publicar demanda
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Pesquisar demandas
          </label>

          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquise por serviço ou cidade..."
            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {["Todas", "Aberta", "Negociando"].map((status) => (
              <button
                key={status}
                onClick={() => setFiltro(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === status
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Total de demandas</p>
            <p className="text-2xl font-bold text-slate-800">
              {demandas.length}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Demandas abertas</p>
            <p className="text-2xl font-bold text-blue-600">
              {demandas.filter((d) => d.status === "Aberta").length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {demandasFiltradas.length > 0 ? (
            demandasFiltradas.map((demanda) => (
              <div
                key={demanda.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {demanda.categoria}
                    </span>

                    <h3 className="text-lg font-bold text-slate-800 mt-3">
                      {demanda.titulo}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {demanda.descricao}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-2 rounded-full w-fit ${
                      demanda.status === "Aberta"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {demanda.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-slate-600">
                  <span>Quantidade: {demanda.quantidade}</span>
                  <span>Localização: {demanda.cidade}</span>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-4 flex justify-end">
                  <button
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    onClick={() => alert("Detalhes da demanda em desenvolvimento.")}
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="font-semibold text-slate-700">
                Nenhuma demanda encontrada.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Tente alterar sua pesquisa ou filtro.
              </p>
            </div>
          )}
        </div>

      </div>
    </PaginaInterna>
  );
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/demandas" element={<Demandas />} />
      <Route
        path="/cadastro-confeccao"
        element={<CadastroConfeccao />}
      />
      <Route
        path="/cadastro-usuario"
        element={<CadastroUsuario />}
      />

    <Route
  path="/minhas-demandas"
  element={<MinhasDemandas />}
/>



      <Route
        path="/cadastro-faccao"
        element={<CadastroFaccao />}
        
        
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
