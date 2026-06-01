import { useState, useRef, useEffect } from "react";

/**
 * SearchableSelect — dropdown dengan search/filter
 *
 * Props:
 *   value        : string | number  — nilai terpilih (id)
 *   onChange     : (val) => void    — callback saat pilih berubah
 *   options      : array            — daftar opsi
 *   getValue     : (o) => string    — ambil value dari setiap opsi  (default: o.id)
 *   getLabel     : (o) => string    — ambil label dari setiap opsi  (default: o.name)
 *   placeholder  : string           — teks saat tidak ada yang dipilih
 *   disabled     : bool
 *   className    : string           — tambahan class untuk wrapper
 *   required     : bool
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  getValue = (o) => o.id,
  getLabel = (o) => o.name,
  placeholder = "Pilih...",
  disabled = false,
  className = "",
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fokus ke search input saat dropdown terbuka
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(search.toLowerCase()),
  );

  const selectedOption = options.find(
    (o) => String(getValue(o)) === String(value),
  );
  const displayLabel = selectedOption ? getLabel(selectedOption) : null;

  const handleSelect = (o) => {
    onChange(getValue(o));
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`input w-full flex items-center justify-between text-left ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        } ${!displayLabel ? "text-gray-400" : "text-gray-800"}`}
      >
        <span className="truncate">{displayLabel || placeholder}</span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {displayLabel && !disabled && (
            <span
              onMouseDown={handleClear}
              className="text-gray-400 hover:text-red-500 leading-none text-lg"
              title="Hapus pilihan"
            >
              ×
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  setSearch("");
                }
              }}
            />
          </div>

          {/* Option list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {/* Empty / reset option */}
            {!required && (
              <li
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-400 ${
                  !value ? "bg-blue-50 font-medium text-blue-600" : ""
                }`}
                onMouseDown={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
              >
                {placeholder}
              </li>
            )}

            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400 italic">
                Tidak ada hasil
              </li>
            )}

            {filtered.map((o) => {
              const val = getValue(o);
              const isSelected = String(val) === String(value);
              return (
                <li
                  key={val}
                  onMouseDown={() => handleSelect(o)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    isSelected
                      ? "bg-blue-50 font-medium text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  {getLabel(o)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
