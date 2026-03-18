import type { ReactNode } from 'react';

type SearchBarProps = {
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function SearchBar({
  label,
  value,
  placeholder,
  onChange,
  leading,
  trailing
}: SearchBarProps) {
  return (
    <label className="search-bar">
      {label ? <span className="search-bar-label">{label}</span> : null}
      <span className="search-bar-field">
        {leading ? <span className="search-bar-leading">{leading}</span> : null}
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        {trailing ? <span className="search-bar-trailing">{trailing}</span> : null}
      </span>
    </label>
  );
}
