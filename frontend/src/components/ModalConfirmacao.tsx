
import { useEffect } from 'react'

interface ModalConfirmacaoProps {
  aberto: boolean
  titulo: string
  mensagem: string
  textoConfirmar?: string
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {

  useEffect(() => {
    if (!aberto) return

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancelar()
      }
    }

    document.addEventListener('keydown', fecharComEscape)

    return () => {
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [aberto, onCancelar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancelar()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby="modal-mensagem"
        className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl">
            !
          </div>

          <div>
            <h2
              id="modal-titulo"
              className="text-xl font-bold text-slate-800"
            >
              {titulo}
            </h2>

            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Confirmação de ação
            </p>
          </div>
        </div>

        <p
          id="modal-mensagem"
          className="text-sm leading-relaxed text-slate-600"
        >
          {mensagem}
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
