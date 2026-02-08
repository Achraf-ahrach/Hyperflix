
import { Calendar, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

import { Comment } from '@/types/profile';



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


export const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card className='border'>
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="text-base">{comment.movieTitle}</CardTitle>
                    <CardDescription className="text-xs mt-1">{timeAgo(comment.createdAt)}</CardDescription>
                </div>
                {/* <Badge variant="secondary" className="text-xs">
            ❤️ {comment.likes}
          </Badge> */}
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{comment.content}</p>
        </CardContent>
    </Card>
);
