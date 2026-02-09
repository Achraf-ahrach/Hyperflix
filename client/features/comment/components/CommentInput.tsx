import { API_URL } from "@/app/utils";
import { useUser } from "@/lib/contexts/UserContext";
import { ImageIcon, Loader2, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";


// --- Comment Input Component ---
interface CommentInputProps {
  onSubmit: (content: string, media?: File) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export const CommentInput = ({ onSubmit, placeholder = "Write a comment...", autoFocus, compact }: CommentInputProps) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const queryClient = useQueryClient();

  if (!user) return null;

  const handleSubmit = async () => {
    if (!content.trim() && !media) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content, media || undefined);
      setContent('');
      setMedia(null);
      queryClient.invalidateQueries({
        queryKey: ['comments']
      });
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus={autoFocus}
          className="flex-1  border  rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/50 transition-colors"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="bg-red-600 p-2 rounded-lg disabled:opacity-50 hover:bg-red-500 transition-colors"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    );
  }

  let imageUrl : string =  ''
  if (!user.avatarUrl) {
    imageUrl = '';
  } else if (!user.avatarUrl.startsWith('http')) {
    imageUrl = `${API_URL}${user.avatarUrl}`;
  } else {
    imageUrl = user.avatarUrl;
  }

  return (
<div className="border border-zinc-400 dark:border-zinc-600 p-5 rounded-2xl">

      <div className="flex gap-4">
        <img src={imageUrl} className="w-10 h-10 rounded-full border border-red-500/50" alt={user.username} />
        <div className="flex-1">
          <textarea
            className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-slate-600"
            placeholder={placeholder}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {media && (
            <div className="relative mt-2 inline-block">
              <img src={URL.createObjectURL(media)} className="h-24 w-24 object-cover rounded-lg border border-slate-700" alt="Upload preview" />
              <button 
                onClick={() => setMedia(null)} 
                className="absolute -top-2 -right-2 bg-red-600 p-1 rounded-full hover:bg-red-500"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mt-4 border-t border-slate-800/50 pt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-500 hover:text-foreground transition-colors"
              aria-label="Attach image"
            >
              <ImageIcon size={20} />
              <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                accept="image/*" 
                onChange={(e) => setMedia(e.target.files?.[0] || null)} 
              />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !media)}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
