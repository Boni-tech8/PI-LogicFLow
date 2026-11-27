
import { useState } from 'react'
import ModalConfirmacao from '../ModalConfirmacao'
import NavegacaoInferior from '../NavegacaoInferior'

interface Demanda {
  id: number
  servico: string
  quantidade: number
  cidade: string
  status: 'Aberta' | 'Negociando' | 'Acordada' | 'Concluída' | 'Pausada'
}

type Aba = 'ativas' | 'pausadas' | 'concluidas'

export default function MinhasDemandas() {
  const [aba, setAba] = useState<Aba>('ativas')

  const [demandas, setDemandas] = useState<Demanda[]>([
    {
      id: 1,
      servico: 'Costura',
      quantidade: 100,
      cidade: 'Recife - PE',
      status: 'Aberta',
    },
    {
      id: 2,
      servico: 'Bordado',
      quantidade: 50,
      cidade: 'Olinda - PE',
      status: 'Negociando',
    },
    {
      id: 3,
      servico: 'Estamparia',
      quantidade: 200,
      cidade: 'Jaboatão dos Guararapes - PE',
      status: 'Concluída',
    },
  ])

  const [modalAberto, setModalAberto] = useState(false)
  const [demandaSelecionada, setDemandaSelecionada] =
    useState<number | null>(null)

  const demandasAtivas = demandas.filter(
    (demanda) =>
      demanda.status !== 'Concluída' &&
      demanda.status !== 'Pausada'
  )

  const demandasPausadas = demandas.filter(
    (demanda) => demanda.status === 'Pausada'
  )

  const demandasConcluidas = demandas.filter(
    (demanda) => demanda.status === 'Concluída'
  )

  const listaExibida =
    aba === 'ativas'
      ? demandasAtivas
      : aba === 'pausadas'
        ? demandasPausadas
        : demandasConcluidas

  function abrirModal(id: number) {
    setDemandaSelecionada(id)
    setModalAberto(true)
  }

  function cancelarModal() {
    setModalAberto(false)
    setDemandaSelecionada(null)
  }

  function confirmarPausa() {
    if (demandaSelecionada === null) return

    setDemandas((lista) =>
      lista.map((demanda) =>
        demanda.id === demandaSelecionada
          ? { ...demanda, status: 'Pausada' }
          : demanda
      )
    )

    cancelarModal()
    setAba('pausadas')
  }

  function reativarDemanda(id: number) {
    setDemandas((lista) =>
      lista.map((demanda) =>
        demanda.id === id
          ? { ...demanda, status: 'Aberta' }
          : demanda
      )
    )

    setAba('ativas')
  }

  function corStatus(status: Demanda['status']): string {
    const cores: Record<Demanda['status'], string> = {
      Aberta: 'bg-blue-50 text-blue-700 ring-blue-200',
      Negociando: 'bg-amber-50 text-amber-700 ring-amber-200',
      Acordada: 'bg-purple-50 text-purple-700 ring-purple-200',
      Concluída: 'bg-green-50 text-green-700 ring-green-200',
      Pausada: 'bg-slate-100 text-slate-600 ring-slate-200',
    }

    return cores[status]
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 pb-9 pt-8 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-200">
            LOGICFLOW
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Minhas demandas
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Acompanhe, organize e gerencie suas solicitações de serviços.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">
                Ativas
              </p>
              <span className="text-xl text-blue-600">●</span>
            </div>

            <p className="mt-3 text-3xl font-bold text-blue-800">
              {demandasAtivas.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Em andamento
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">
                Concluídas
              </p>
              <span className="text-xl text-green-600">✓</span>
            </div>

            <p className="mt-3 text-3xl font-bold text-green-600">
              {demandasConcluidas.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Finalizadas
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">
                Pausadas
              </p>
              <span className="text-xl text-slate-500">Ⅱ</span>
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-600">
              {demandasPausadas.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Temporariamente suspensas
            </p>
          </div>
        </section>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            Suas solicitações
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecione uma categoria para visualizar suas demandas.
          </p>
        </div>

        <section className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-200 p-1">
          <button
            type="button"
            aria-pressed={aba === 'ativas'}
            onClick={() => setAba('ativas')}
            className={`rounded-lg px-2 py-3 text-xs font-semibold transition sm:text-sm ${
              aba === 'ativas'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ativas ({demandasAtivas.length})
          </button>

          <button
            type="button"
            aria-pressed={aba === 'pausadas'}
            onClick={() => setAba('pausadas')}
            className={`rounded-lg px-2 py-3 text-xs font-semibold transition sm:text-sm ${
              aba === 'pausadas'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pausadas ({demandasPausadas.length})
          </button>

          <button
            type="button"
            aria-pressed={aba === 'concluidas'}
            onClick={() => setAba('concluidas')}
            className={`rounded-lg px-2 py-3 text-xs font-semibold transition sm:text-sm ${
              aba === 'concluidas'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Concluídas ({demandasConcluidas.length})
          </button>
        </section>

        <section className="space-y-4">
          {listaExibida.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-700">
                ▤
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-800">
                Nenhuma demanda encontrada
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Não existem solicitações nesta categoria no momento.
              </p>
            </div>
          ) : (
            listaExibida.map((demanda) => (
              <article
                key={demanda.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      DEMANDA #{demanda.id}
                    </p>

                    <h3 className="mt-2 break-words text-xl font-bold text-slate-800">
                      {demanda.servico}
                    </h3>
                  </div>

                  <span
                    className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${corStatus(demanda.status)}`}
                  >
                    {demanda.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Quantidade
                    </p>

                    <p className="mt-2 font-semibold text-slate-700">
                      {demanda.quantidade} peças
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Localização
                    </p>

                    <p className="mt-2 break-words font-semibold text-slate-700">
                      {demanda.cidade}
                    </p>
                  </div>
                </div>

                {aba === 'ativas' && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => abrirModal(demanda.id)}
                      className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    >
                      Pausar demanda
                    </button>
                  </div>
                )}

                {aba === 'pausadas' && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => reativarDemanda(demanda.id)}
                      className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Reativar demanda
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </main>

      <ModalConfirmacao
        aberto={modalAberto}
        titulo="Pausar demanda"
        mensagem="Tem certeza de que deseja pausar esta demanda? Ela deixará de aparecer entre as solicitações ativas."
        textoConfirmar="Sim, pausar"
        onConfirmar={confirmarPausa}
        onCancelar={cancelarModal}
      />

      <NavegacaoInferior />
    </div>
  )
}
