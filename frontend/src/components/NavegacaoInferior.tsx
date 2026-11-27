
import { NavLink } from 'react-router-dom'

export default function NavegacaoInferior() {
  const links = [
    {
      nome: 'Início',
      caminho: '/inicio',
      icone: '⌂',
    },
    {
      nome: 'Minhas demandas',
      caminho: '/minhas-demandas',
      icone: '▤',
    },
    {
      nome: 'Publicar',
      caminho: '/publicar-demanda',
      icone: '+',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-4xl items-stretch justify-around px-2">

        {links.map((link) => (
          <NavLink
            key={link.caminho}
            to={link.caminho}
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-3 transition-colors duration-200 ${
                isActive
                  ? 'text-blue-700'
                  : 'text-slate-500 hover:text-blue-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-b-full bg-blue-700" />
                )}

                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-2xl transition ${
                    isActive
                      ? 'bg-blue-50'
                      : 'bg-transparent'
                  }`}
                >
                  {link.icone}
                </span>

                <span
                  className={`max-w-full truncate text-center text-xs ${
                    isActive
                      ? 'font-bold'
                      : 'font-medium'
                  }`}
                >
                  {link.nome}
                </span>
              </>
            )}
          </NavLink>
        ))}

      </div>
    </nav>
  )
}
