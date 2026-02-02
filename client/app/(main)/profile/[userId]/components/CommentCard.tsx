import { Comment } from '../types/types';

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

export const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <div className="py-4 border   ">
      <div className="flex gap-4">
        {/* Poster */}
        <img
          src={comment.moviePosterUrl}
          alt={comment.movieTitle}
          className="h-24 w-16 rounded-md object-cover flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title + Time */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-sm sm:text-base font-medium text-zinc-900 dark:text-zinc-100">
              {comment.movieTitle}
            </h3>

            <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Rating */}
          <span className="inline-flex items-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {comment.rating} ⭐
          </span>

          {/* Comment */}
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 break-words">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
};
