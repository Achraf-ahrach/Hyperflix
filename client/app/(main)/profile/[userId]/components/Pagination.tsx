
// Pagination Component
export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);
    
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    
    if (currentPage <= 3) {
      end = showPages - 1;
    }
    if (currentPage >= totalPages - 2) {
      start = totalPages - showPages + 2;
    }
    
    if (start > 2) pages.push('...');
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors text-sm font-medium"
      >
        Previous
      </button>
      
      <div className="flex gap-1">
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-4 py-2 transition-colors text-sm font-medium ${
              page === currentPage
                ? 'bg-white text-black'
                : page === '...'
                ? 'bg-transparent text-zinc-600 cursor-default'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors text-sm font-medium"
      >
        Next
      </button>
    </div>
  );
};
