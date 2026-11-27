
import { useState } from "react";
import type { FormEvent } from "react";

function CadastroConfeccao() {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [descricao, setDescricao] = useState("");

  function formatarCNPJ(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function validarCNPJ(cnpj: string) {
    const numeros = cnpj.replace(/\D/g, "");

    if (numeros.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(numeros)) return false;

    const calcularDigito = (base: string, pesos: number[]) => {
      const soma = base
        .split("")
        .reduce((total, numero, indice) => {
          return total + Number(numero) * pesos[indice];
        }, 0);

      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const primeiro = calcularDigito(
      numeros.slice(0, 12),
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    const segundo = calcularDigito(
      numeros.slice(0, 12) + primeiro,
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return numeros.endsWith(`${primeiro}${segundo}`);
  }

  function formatarTelefone(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validarCNPJ(cnpj)) {
      alert("CNPJ inválido! Confira os números digitados.");
      return;
    }

    if (telefone.replace(/\D/g, "").length !== 11) {
      alert("Telefone inválido! Digite o DDD e os 9 números.");
      return;
    }

    console.log({
      nome,
      cnpj,
      telefone,
      cidade,
      endereco,
      especialidade,
      descricao,
    });

    alert("Dados da confecção preenchidos!");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <form
        onSubmit={cadastrar}
        className="bg-white w-full max-w-3xl p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 space-y-6"
      >
        <div className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <span className="text-xl font-bold">LF</span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                LogicFlow
              </h2>
              <p className="text-xs text-slate-500">
                Conectando oportunidades
              </p>
            </div>
          </div>

          <span className="text-sm font-semibold text-blue-600">
            CADASTRO DE EMPRESA
          </span>

          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Cadastre sua confecção
          </h1>

          <p className="text-slate-500 mt-2">
            Apresente sua empresa e conecte-se a novas oportunidades.
          </p>
        </div>

        <div>
          <label className="block mb-1">Nome da confecção</label>
          <input
            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da empresa"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1">CNPJ</label>
            <input
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              value={cnpj}
              onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Telefone comercial</label>
            <input
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1">Cidade</label>
            <input
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Sua cidade"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Endereço</label>
            <input
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número e bairro"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">Especialidade</label>
          <select
            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option value="Jeans">Jeans</option>
            <option value="Moda feminina">Moda feminina</option>
            <option value="Moda masculina">Moda masculina</option>
            <option value="Camisaria">Camisaria</option>
            <option value="Moda infantil">Moda infantil</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Descrição da empresa</label>
          <textarea
            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Conte um pouco sobre sua confecção..."
            rows={4}
            required
            maxLength={300}
          />
          <p className="text-xs text-slate-400 text-right mt-1">
            {descricao.length}/300 caracteres
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold p-4 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200"
        >
          Cadastrar confecção
        </button>
      </form>
    </div>
  );
}

export default CadastroConfeccao;
