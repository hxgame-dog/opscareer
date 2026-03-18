type TabItem<T extends string> = {
  id: T;
  label: string;
};

type ToolbarTabsProps<T extends string> = {
  value: T;
  items: Array<TabItem<T>>;
  onChange: (value: T) => void;
};

export function ToolbarTabs<T extends string>({ value, items, onChange }: ToolbarTabsProps<T>) {
  return (
    <div className="toolbar-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`toolbar-tab ${value === item.id ? 'toolbar-tab-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
