import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import NavegacaoInferior from '../NavegacaoInferior'
import ModalConfirmacao from '../ModalConfirmacao'

export default function PublicarDemanda() {
  const navigate = useNavigate()

  const [servico, setServico] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [prazo, setPrazo] = useState('')
  const [cidade, setCidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  const hoje = new Date()
  const hojeFormatado = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0'),
  ].join('-')

  function abrirConfirmacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!servico || !quantidade || !prazo || !cidade.trim() || !descricao.trim()) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    if (Number(quantidade) < 1) {
      alert('Informe uma quantidade válida de peças.')
      return
    }

    if (prazo < hojeFormatado) {
      alert('O prazo de entrega não pode ser anterior a hoje.')
      return
    }

    setModalAberto(true)
  }

  function publicarDemanda() {
    const demanda = {
      servico,
      quantidade: Number(quantidade),
      prazo,
      cidade: cidade.trim(),
      descricao: descricao.trim(),
      status: 'Aberta',
    }

    console.log('Demanda publicada:', demanda)

    setModalAberto(false)

    alert('Demanda cadastrada na demonstração com sucesso!')

    navigate('/minhas-demandas')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-300">
            LogicFlow / Demandas
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            Publicar demanda
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 md:text-base">
            Encontre parceiros para sua produção. Informe os detalhes
            do serviço e conecte sua confecção a novas facções.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl text-blue-700">
            +
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Informações da produção
            </h2>
            <p className="text-sm text-slate-500">
              Preencha os campos para criar sua solicitação.
            </p>
          </div>
        </div>

        <form
          onSubmit={abrirConfirmacao}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8"
        >
          <div>
            <label
              htmlFor="servico"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Tipo de serviço *
            </label>

            <select
              id="servico"
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecione o serviço</option>
              <option value="Costura">Costura</option>
              <option value="Bordado">Bordado</option>
              <option value="Estamparia">Estamparia</option>
              <option value="Corte">Corte</option>
              <option value="Acabamento">Acabamento</option>
              <option value="Lavanderia">Lavanderia</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="quantidade"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Quantidade de peças *
              </label>

              <input
                id="quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex: 500"
                required
                className="w-full rounded-xl border border-slate-300 p-3.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="prazo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Prazo de entrega *
              </label>

              <input
                id="prazo"
                type="date"
                min={hojeFormatado}
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-3.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="cidade"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Cidade de realização *
            </label>

            <input
              id="cidade"
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Santa Cruz do Capibaribe - PE"
              required
              className="w-full rounded-xl border border-slate-300 p-3.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Descrição da demanda *
            </label>

            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o serviço, o tipo de peça, os materiais necessários e outras informações importantes..."
              required
              minLength={10}
              rows={5}
              className="w-full resize-y rounded-xl border border-slate-300 p-3.5 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              Seja claro para facilitar o entendimento das facções interessadas.
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-relaxed text-blue-800">
              <strong>Importante:</strong> revise as informações antes
              de publicar. Uma descrição detalhada ajuda a encontrar
              parceiros adequados para sua produção.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/inicio')}
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-700 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Revisar e publicar
            </button>
          </div>
        </form>
      </main>

      <NavegacaoInferior />

      <ModalConfirmacao
        aberto={modalAberto}
        titulo="Publicar demanda"
        mensagem="Deseja confirmar a publicação desta demanda? As informações serão registradas nesta demonstração."
        textoConfirmar="Sim, publicar"
        onConfirmar={publicarDemanda}
        onCancelar={() => setModalAberto(false)}
      />
    </div>
  )
}