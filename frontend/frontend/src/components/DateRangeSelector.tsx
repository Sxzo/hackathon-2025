import React, { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';

interface DateRangeSelectorProps {
  selectedDays: number;
  onRangeChange: (days: number) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selectedDays, onRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const dateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 180 days', days: 180 },
    { label: 'Last 365 days', days: 365 },
  ];

  // Get the label for the currently selected range
  const getSelectedLabel = () => {
    const selected = dateRanges.find(range => range.days === selectedDays);
    return selected ? selected.label : 'Custom range';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FiCalendar size={16} />
        <span>{getSelectedLabel()}</span>
        <FiChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {dateRanges.map((range) => (
            <button
              key={range.days}
              onClick={() => {
                onRangeChange(range.days);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                selectedDays === range.days ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector; 