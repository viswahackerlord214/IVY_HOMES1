export default function Pagination({ offset, limit, total, onPageChange }) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  if (totalPages <= 1) return null;

  const goTo = (page) => {
    onPageChange((page - 1) * limit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to show
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {start > 1 && (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => goTo(1)}>1</button>
          {start > 2 && <span className="pagination-info">…</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          className={`btn ${p === currentPage ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => goTo(p)}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-info">…</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => goTo(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        Next →
      </button>

      <span className="pagination-info">
        {offset + 1}–{Math.min(offset + limit, total)} of {total}
      </span>
    </div>
  );
}
