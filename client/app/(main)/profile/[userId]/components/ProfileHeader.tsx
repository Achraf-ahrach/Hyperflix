import { API_URL } from "@/app/utils";
import { User } from "../types/types";

export const ProfileHeader: React.FC<{ user: User }> = ({ user }) => {
  if (user.avatarUrl === "") user.avatarUrl = null;

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="relative p-8">
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          <img
            src={
              user.avatarUrl
                ? user.avatarUrl.startsWith("/")
                  ? `${API_URL}${user.avatarUrl}`
                  : user.avatarUrl
                : undefined
            }
            alt="profile"
            className="w-28 h-28 object-cover border "
          />
        </div>

        {/* User Info */}
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            laz
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.username}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="border p-4 text-center">
            <div className="text-2xl font-bold text-foreground mb-1">
              {user.watchedCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Watched
            </div>
          </div>

          <div className="border p-4 text-center">
            <div className="text-2xl font-bold text-foreground mb-1">
              {user.commentsCount}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Comments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
