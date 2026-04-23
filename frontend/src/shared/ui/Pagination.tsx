interface Props {
  page: number        // 0-indexed (Spring)
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i)
  const visible = pages.filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 2,
  )

  return (
    <nav>
      <ul className="pagination pagination-sm justify-content-center mb-0">
        <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(page - 1)}>
            &laquo;
          </button>
        </li>

        {visible.map((p, i) => {
          const prev = visible[i - 1]
          const showEllipsis = prev !== undefined && p - prev > 1
          return (
            <span key={p}>
              {showEllipsis && (
                <li className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              )}
              <li className={`page-item ${p === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onChange(p)}>
                  {p + 1}
                </button>
              </li>
            </span>
          )
        })}

        <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(page + 1)}>
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  )
}
