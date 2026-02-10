import { API_URL } from "@/app/utils";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateString: string) {
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

export const resolveApiUrl = (path?: string | null, baseUrl: string = API_URL) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
};
