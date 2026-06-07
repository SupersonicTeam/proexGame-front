/**
 * Trilha que conecta as casas, usando o caminho suave (curvas). Camadas
 * empilhadas: sombra → casca branca → faixa colorida (gradiente arco-íris) →
 * linha central tracejada com "marcha" animada (CSS). Pontas/junções
 * arredondadas. Desenhada abaixo das casas.
 */
interface PathConnectorProps {
  d: string
  /** Sufixo único para o id do gradiente. */
  uid: string
}

export function PathConnector({ d, uid }: PathConnectorProps) {
  const gradId = `track-${uid}`
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Sombra. */}
      <path
        d={d}
        fill="none"
        stroke="#0f172a"
        strokeOpacity={0.18}
        strokeWidth={42}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0 4)"
      />
      {/* Casca branca. */}
      <path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeWidth={40}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Faixa colorida. */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={28}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Linha central tracejada (marcha). */}
      <path
        className="track-dash"
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.85}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="2 22"
      />
    </g>
  )
}
