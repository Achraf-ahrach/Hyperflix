import { TabType } from "../types/types";


// Tabs Component
export const Tabs: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'watched' as TabType, label: 'Watched Movies' },
    { id: 'watchLater' as TabType, label: 'Watch Later' },
    { id: 'comments' as TabType, label: 'Comments' },
  ];

  return (
    <div className="border-b border-zinc-800">
      <div className="flex gap-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 font-medium transition-all whitespace-nowrap relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
