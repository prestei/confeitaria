/** Marca DocePedido — ícone do menu do painel. */
export function DocePedidoMark({ className }: { className?: string }) {
  return (
    <span
      className={className}
      aria-hidden
      style={{
        background: "linear-gradient(145deg, #F07878 0%, #C85A5A 50%, #A84848 100%)",
      }}
    >
      <svg viewBox="0 0 32 32" className="h-full w-full" fill="none">
        {/* pirulito / doce enrolado */}
        <path
          d="M16.2 6.2c-3.4 0-6.1 2.5-6.1 5.8 0 2.4 1.3 4.2 3.2 5.4 1 .6 1.6 1.3 1.6 2.4v.7h2.2v-.7c0-1.5.8-2.4 2-3.2 1.9-1.2 3.2-2.9 3.2-5.2 0-3-2.5-5.2-6.1-5.2Z"
          fill="#F6D45A"
        />
        <path
          d="M12.4 11.2c.5-2 2-3.2 3.8-3.2 1.2 0 2 .5 2 1.4 0 .8-.6 1.3-1.4 1.8-.9.6-2 1.3-2.6 2.4-.3-1-.8-1.7-1.8-2.4Z"
          fill="#FFE98A"
        />
        <rect x="15.1" y="20.2" width="1.8" height="5.4" rx="0.9" fill="#F6D45A" />
        <ellipse cx="16" cy="26.2" rx="2.4" ry="1.1" fill="#F6D45A" />
      </svg>
    </span>
  );
}
