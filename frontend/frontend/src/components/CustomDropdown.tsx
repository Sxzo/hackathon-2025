import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
  
  const handleOptionClick = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
  };
  
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="font-medium text-gray-700 mb-2 block">{label}</label>}
      <button
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between p-3 bg-white border rounded-lg border-gray-300 
        hover:border-[#004977] focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977] 
        transition-all ${className}`}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon}
          <span className="text-gray-700">{selectedOption?.label}</span>
        </div>
        <FiChevronDown
          className={`text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={(e) => handleOptionClick(option.value, e)}
                className={`flex items-center gap-2 w-full p-3 text-left hover:bg-[#f0f7fc] transition-colors
                ${value === option.value ? 'bg-[#f0f7fc] text-[#004977]' : 'text-gray-700'}`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown; 