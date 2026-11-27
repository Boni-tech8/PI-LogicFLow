
import { useState } from "react";
import type { FormEvent } from "react";

export default function CadastroFaccao() {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [descricao, setDescricao] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  function formatarCNPJ(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 14);

    return numeros
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setTipoMensagem("");

    if (
      !nome.trim() ||
      !cnpj.trim() ||
      !telefone.trim() ||
      !cidade.trim() ||
      !endereco.trim() ||
      !especialidade ||
      !capacidade.trim()
    ) {
      setMensagem("Preencha todos os campos obrigatórios.");
      setTipoMensagem("erro");
      return;
    }

    if (cnpj.replace(/\D/g, "").length !== 14) {
      setMensagem("Informe um CNPJ válido.");
      setTipoMensagem("erro");
      return;
    }

    if (telefone.replace(/\D/g, "").length < 10) {
      setMensagem("Informe um telefone válido.");
      setTipoMensagem("erro");
      return;
    }

    const dadosFaccao = {
      nome,
      cnpj,
      telefone,
      cidade,
      endereco,
      especialidade,
      capacidade: Number(capacidade),
      descricao,
    };

    console.log("Dados da facção:", dadosFaccao);

    setMensagem("Cadastro realizado com sucesso!");
    setTipoMensagem("sucesso");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl p-8 rounded-xl shadow-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Cadastro de Facção
          </h1>

          <p className="text-gray-500 mt-2">
            Cadastre sua facção e conecte-se às confecções do
            Polo de Confecções do Agreste.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Nome da facção *
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da facção"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                CNPJ *
              </label>

              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Telefone *
              </label>

              <input
                type="text"
                value={telefone}
                onChange={(e) =>
                  setTelefone(formatarTelefone(e.target.value))
                }
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Cidade *
            </label>

            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Digite a cidade onde a facção está localizada"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Endereço *
            </label>

            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número e bairro"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Especialidade *
            </label>

            <select
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a especialidade</option>
              <option value="Costura">Costura</option>
              <option value="Corte">Corte</option>
              <option value="Acabamento">Acabamento</option>
              <option value="Bordado">Bordado</option>
              <option value="Estamparia">Estamparia</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Capacidade de produção (peças por semana) *
            </label>

            <input
              type="number"
              min="1"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
              placeholder="Ex.: 500"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Descrição da facção
            </label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva os serviços oferecidos pela facção..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mensagem && (
            <div
              className={`p-3 rounded-lg text-sm ${
                tipoMensagem === "sucesso"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Cadastrar Facção
          </button>
        </form>
      </div>
    </div>
  );
}
