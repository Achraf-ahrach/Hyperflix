import { Button } from "../ui/button";

export const Pagination = ({ current, total, onPageChange }: { current: number; total: number; onPageChange: (page: number) => void }) => (
    <div className="flex justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, current - 1))}
        disabled={current === 1}
      >
        Previous
      </Button>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={current === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="w-10"
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(total, current + 1))}
        disabled={current === total}
      >
        Next
      </Button>
    </div>
  );

