import { User } from "../types/types";

// ProfileHeader Component
export const ProfileHeader: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br ">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-600 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600 blur-3xl"></div>
      </div>
      
      <div className="relative p-8">
        {/* Profile Image with glow effect */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600 blur-xl opacity-20"></div>
            <img
              src={user.avatarUrl}
              alt="ww"
              className="relative w-28 h-28 object-cover border-2 border-red-600/30"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">laz</h1>
          <p className="text-zinc-400 text-sm">{user.username}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1 bg-black/30 p-1">
          <div className="bg-zinc-900/50 p-4 text-center hover:bg-zinc-800/50 transition-colors">
            <div className="text-2xl font-bold text-white mb-1">{user.watchedCount.toLocaleString()}</div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Watched</div>
          </div>
          <div className="bg-zinc-900/50 p-4 text-center hover:bg-zinc-800/50 transition-colors">
            <div className="text-2xl font-bold text-white mb-1">{user.commentsCount}</div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Comments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

