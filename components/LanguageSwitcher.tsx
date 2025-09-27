'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

// Define the type for the languages object for better type safety
type Languages = {
  [key: string]: string;
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // New state to track if component is mounted

  // Map language codes to display names
  const languages: Languages = {
    en: "English",
    hi: "हिन्दी",
    or: "ଓଡ଼ିଆ",
    as: "অসমীয়া",
  };

  useEffect(() => {
    // This effect runs only on the client side after hydration
    setMounted(true);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  // Safely get the current language name, falling back to the code if not found
  const currentLanguageName = languages[i18n.language] || i18n.language;

  // Render null on the server to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative inline-block text-left">
      {/* Button to toggle dropdown */}
      <Button
        variant="outline"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 capitalize"
      >
        {currentLanguageName}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          {Object.keys(languages).map((lng) => (
            <button
              key={lng}
              onClick={() => changeLanguage(lng)}
              className="block px-4 py-2 text-sm text-foreground rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left capitalize"
              role="menuitem"
              tabIndex={-1}
              disabled={i18n.language === lng}
            >
              {languages[lng]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;