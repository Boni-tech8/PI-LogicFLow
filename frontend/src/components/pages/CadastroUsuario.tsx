
import { useState } from "react";
import type { FormEvent } from "react";

function CadastroUsuario() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  function formatarTelefone(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function cadastrar(event: FormEvent) {
    event.preventDefault();

    if (telefone.replace(/\D/g, "").length !== 11) {
      alert("Digite um telefone válido!");
      return;
    }

    if (senha.length < 6) {
      alert("A senha precisa ter pelo menos 6 caracteres!");
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    console.log({
      nome,
      email,
      telefone,
      senha,
    });

    alert("Dados do usuário preenchidos com sucesso!");
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">

        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
            LF
          </div>

          <h1 className="text-3xl font-bold text-slate-800">
            LogicFlow
          </h1>

          <p className="text-slate-500 mt-2">
            Crie sua conta e faça parte da nossa rede
          </p>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 mb-6">
          Cadastre-se
        </h2>

        <form onSubmit={cadastrar} className="space-y-5">

          <div>
            <label className="block mb-1 font-medium text-slate-700">
              Nome completo
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1 font-medium text-slate-700">
                E-mail
              </label>
              <input
                type="email"
                className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-slate-700">
                Telefone
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1 font-medium text-slate-700">
                Senha
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-slate-700">
                Confirmar senha
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita sua senha"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg p-3 transition-colors"
          >
            Criar minha conta
          </button>

          <p className="text-center text-sm text-slate-500">
            Ao criar sua conta, você poderá acessar a plataforma LogicFlow.
          </p>

        </form>
      </div>
    </main>
  );
}

export default CadastroUsuario;
