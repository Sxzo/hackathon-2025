import React from 'react';

interface DateRangeSelectorProps {
  selectedDays: number;
  onRangeChange: (days: number) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selectedDays, onRangeChange }) => {
  const options = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: '1y', value: 365 }
  ];

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            selectedDays === option.value
              ? 'bg-white text-[#004977] shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => onRangeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector; 