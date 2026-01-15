import { Loader2 } from "lucide-react";




export default function LoadingSetting()
{
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your settings...</p>
        </div>
      </div>
    )
}