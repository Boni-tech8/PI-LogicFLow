
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log("Dados de login:", {
      email,
      senha,
      lembrar,
    });

    alert("Interface pronta! A autenticação será conectada ao backend.");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8">

      <div className="w-full max-w-6xl min-h-[650px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* PAINEL ESQUERDO */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">

          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl" />

          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-3xl" />

          <div className="relative z-10">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-2xl font-black">L</span>
              </div>

              <span className="text-2xl font-bold tracking-tight">
                Logic<span className="text-blue-400">Flow</span>
              </span>
            </div>

          </div>

          <div className="relative z-10 max-w-md">

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-8">
              Plataforma de conexão têxtil
            </span>

            <h1 className="text-5xl font-bold leading-tight mb-6">
              Conectando negócios.
              <span className="block text-blue-400">
                Transformando oportunidades.
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed">
              Uma plataforma desenvolvida para aproximar confecções e
              facções, simplificar processos e fortalecer o Polo de
              Confecções do Agreste Pernambucano.
            </p>

            <div className="mt-10 flex items-center gap-4">

              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-slate-950 flex items-center justify-center font-bold">C</div>
                <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-slate-950 flex items-center justify-center font-bold">F</div>
                <div className="w-10 h-10 rounded-full bg-sky-500 border-2 border-slate-950 flex items-center justify-center font-bold">L</div>
              </div>

              <p className="text-sm text-slate-400">
                <strong className="text-white">Conexões inteligentes</strong>
                <br />
                Para o setor de confecções.
              </p>

            </div>
          </div>

          <div className="relative z-10 text-sm text-slate-500">
            © 2026 LogicFlow. Todos os direitos reservados.
          </div>

        </div>

        {/* PAINEL DIREITO - LOGIN */}
        <div className="flex items-center justify-center p-7 sm:p-12 lg:p-16">

          <div className="w-full max-w-md">

            <div className="md:hidden flex items-center gap-3 mb-12">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                L
              </div>

              <span className="text-2xl font-bold text-slate-900">
                Logic<span className="text-blue-600">Flow</span>
              </span>
            </div>

            <div className="mb-10">

              <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
                Bem-vindo de volta
              </span>

              <h2 className="text-4xl font-bold text-slate-900 mt-3">
                Faça seu login
              </h2>

              <p className="text-slate-500 mt-3">
                Acesse sua conta para continuar utilizando o LogicFlow.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  E-mail
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                />

              </div>

              {/* SENHA */}
              <div>

                <div className="flex justify-between items-center mb-2">

                  <label className="text-sm font-semibold text-slate-700">
                    Senha
                  </label>

                </div>

                <div className="relative">

                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="w-full px-4 py-4 pr-20 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>

                </div>

              </div>

              {/* LEMBRAR */}
              <div className="flex items-center justify-between">

                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />

                  Lembrar de mim

                </label>

                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  onClick={() => alert("Recuperação de senha será implementada.")}
                >
                  Esqueceu a senha?
                </button>

              </div>

              {/* BOTÃO */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold shadow-lg shadow-blue-600/20 transition-all duration-200"
              >
                Entrar na plataforma
              </button>

            </form>

            {/* CADASTRO */}
            <div className="mt-9 text-center">

              <p className="text-sm text-slate-500">
                Ainda não possui uma conta?
                {" "}
                <a
                  href="/cadastro-usuario"
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Criar conta
                </a>
              </p>

            </div>

            <div className="mt-12 pt-6 border-t border-slate-100 text-center">

              <p className="text-xs text-slate-400">
                LogicFlow — Conectando o futuro da indústria têxtil.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
