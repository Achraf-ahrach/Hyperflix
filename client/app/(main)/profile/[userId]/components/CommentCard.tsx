
import {Comment} from '../types/types';


function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) {
      return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

// CommentCard Component
export const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => {
  console.log(comment.content) ;
  return (
    <div className="bg-zinc-900 p-4 sm:p-6 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0 w-16 sm:w-16">
          <img
            src={comment.moviePosterUrl}
            alt={comment.movieTitle}
            className="w-full h-24 object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-white font-medium text-sm sm:text-base truncate">{comment.movieTitle}</h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                <div className="flex items-center gap-1">
                  
                    <span
                    >
                     {comment.rating } ⭐
                    </span>
                 
                </div>
                <span className="text-zinc-500 text-xs">{timeAgo(comment.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed break-words">{comment.content}</p>

        </div>
      </div>
    </div>
  );
};
