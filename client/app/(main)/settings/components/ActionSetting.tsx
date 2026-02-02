import { Check, Loader2, X } from "lucide-react";


interface ActionSettingProps {
    isSaving: boolean;
    handleSave: () => void;
    handleCancel: () => void;
  }
  


export default function ActionSetting({
    isSaving,
    handleSave,
    handleCancel,
  }: ActionSettingProps)
{
    return (
        <div className="flex gap-4 mt-8 pt-6 border-t ">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed  font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check size={20} />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-6 py-3 border hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <X size={20} />
          Cancel
        </button>
    </div>
    )

}