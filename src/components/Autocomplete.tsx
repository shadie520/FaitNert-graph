import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Station } from "../lib/graph";

interface AutocompleteProps {
  label: string;
  placeholder: string;
  stations: Station[];
  value: string;
  onChange: (value: string) => void;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  placeholder,
  stations,
  value,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.length >= 2 && isOpen) {
        const filtered = stations.filter((s) => s.name.includes(inputValue));
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [inputValue, stations, isOpen]);

  const handleSelect = (stationName: string) => {
    setInputValue(stationName);
    onChange(stationName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((station) => (
            <li
              key={station.id}
              className="cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900"
              onClick={() => handleSelect(station.name)}
            >
              {station.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
