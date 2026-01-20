import { CommentCard } from "./CommentCard";
import { Comment } from '../types/types';



export
  const CommentsSection: React.FC<{
    comments: Comment[];
    currentPage: number;
    onPageChange: (pageNum: number) => void;
    total: number
  }> = ({ comments,
    currentPage,
    onPageChange,
    total,
  }) => {
      return (
        <div className="space-y-0">
          <div className="text-sm text-zinc-500 px-6 py-4 bg-zinc-900">
            {comments.length} comments
          </div>

          <div>
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>

          {total > comments.length &&
            (<button
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-sm font-medium"
              onClick={() => onPageChange(currentPage + 1)}
            >
              Load More Comments
            </button>)}
        </div>
      );
    };