import { Bot, ChevronDown, Mail, Moon, RefreshCw, Sun, UserRoundX } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import React, { useState } from "react";

const Navbar = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const handleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <nav>
      <div className="bg-white flex p-4 border-2 rounded-lg flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            MailMind
          </h1>
          <ChevronDown className="block md:hidden" />
        </div>

        <div className="flex items-center gap-4">
          <RefreshCw />
          <button>
            {darkMode ? (
              <Sun
                className="w-5 h-5 text-yellow-500"
                onClick={handleDarkMode}
              />
            ) : (
              <Moon
                className="w-5 h-5 text-gray-500"
                onClick={handleDarkMode}
              />
            )}
          </button>

          <div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:block">{user.name}</span>
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
              </div>
            )}
            {!user && (
              <div className="text-sm text-gray-500">
                {" "}
                <UserRoundX />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
