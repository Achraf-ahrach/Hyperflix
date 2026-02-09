
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

import { Comment } from '@/types/profile/profile';
import { API_URL } from "@/app/utils";
import { Badge } from "../ui/badge";
import { SpoilerText } from "@/features/comment/components/SpoilerText";
import { timeAgo } from "@/lib/utils";





export const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card  className='border-l rounded-none'>
        <CardHeader >
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="text-base">{comment.movieTitle}</CardTitle>
                    <CardDescription className="text-xs mt-1">{timeAgo(comment.createdAt)}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
            ❤️ {comment.likes}
            </Badge>
            </div>
        </CardHeader>
        <CardContent  >
            {/* <p className="text-sm text-muted-foreground">{comment.content}</p> */}
            <SpoilerText text={comment.content} />
            {
                comment.media && comment.media.length > 0 && (
                    <img src={`${API_URL}${comment.media[0].url}`} alt={comment.movieTitle} className="w-16 h-24 object-cover rounded" />
                )
            }
        </CardContent>
    </Card>
);
