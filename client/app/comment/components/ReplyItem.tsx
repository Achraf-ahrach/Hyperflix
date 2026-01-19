"use client"
import { Heart } from "lucide-react";
import { Reply } from "../types/types";
import { useState } from "react";




interface ReplyItemProps {
  reply: Reply;
  onLike: () => void;
  onDelete: () => void; // Added delete handler
}

export const ReplyItem = ({ reply, onLike, onDelete }: ReplyItemProps) => {


  // const [showMenu, setShowMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  console.log(showMenu);
  return (

    <div className="flex gap-3">
      <img src={reply.userAvatar} className="w-7 h-7 rounded-full bg-slate-800" alt={reply.username} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-300">{reply.username}</span>
            <span className="text-[10px] text-slate-600">• Just now</span>
          </div>

          {/* Three dots menu for deletion */}
          <div className="relative group">
            <button className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setShowMenu(!showMenu)} >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="6" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="18" r="1" />
              </svg>
            </button>

            {/* Dropdown menu */}

            { showMenu && (
                <div className="absolute right-0 top-full mt-1 w-24 bg-slate-800 border border-slate-700 rounded-md shadow-lg transition-all duration-200 z-10">
                  <button
                    onClick={() => null}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )
            }
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-0.5">{reply.content}</p>
        <button
          onClick={onLike}
          className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${reply.isLiked ? 'text-red-500 font-bold' : 'text-slate-600 hover:text-red-400'
            }`}
        >
          <Heart size={10} fill={reply.isLiked ? "currentColor" : "none"} />
          {reply.likes}
        </button>
      </div>
    </div>
  )
};