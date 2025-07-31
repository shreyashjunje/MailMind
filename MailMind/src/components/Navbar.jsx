import React, { useEffect, useRef, useState } from "react";

import {
  Bot,
  Camera,
  ChevronDown,
  LogOut,
  Mail,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  UserRoundX,
  UserRoundXIcon,
  X,
} from "lucide-react";
import useAuth from "../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileImgRef = useRef(null);
  const modalRef = useRef(null);

  const handleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        profileImgRef.current &&
        !profileImgRef.current.contains(event.target)
      ) {
        setShowProfileModal(false);
      }
    };

    if (showProfileModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileModal]);

  return (
    <nav >
      <div className=" bg-white p-4 border-2 rounded-lg flex items-center justify-between shadow-md relative">
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
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer"
                  onClick={toggleProfileModal}
                />

                {/* Profile Modal */}
                {showProfileModal && (
                  <div
                    ref={modalRef}
                    className="absolute top-16  right-8 bg-white rounded-xl shadow-xl border border-gray-200 w-96 z-50"
                  >
                    {/* User Info Section */}

                    {/* <div className="p-4 border-b border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">
                          {user.email}
                        </span>
                        <h3 className="text-lg font-normal mt-1">
                          Hi, {user.name}!
                        </h3>
                      </div>
                    </div> */}
                    <div className="px-6 py-4 flex items-center justify-between  border-gray-200  ">
                      <span className="text-gray-800 ml-16 text-sm font-medium truncate pt-1">
                        {user.email}
                      </span>
                      <button
                        onClick={() => setShowProfileModal(false)}
                        className="text-gray-400 hover:text-black transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Manage Account
                    <div className="p-2">
                      <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                        Manage your Google Account
                      </button>
                    </div> */}

                    {/* Profile Section */}
                    <div className="px-6 pb-6 text-center">
                      {/* Avatar with camera icon */}
                      <div className="relative inline-block ">
                        {/* <div className="w-20 h-20 bg-amber-700 rounded-full flex items-center justify-center text-white text-2xl font-medium relative">
                          {user.picture}
                          <div className="absolute bottom-0 right-0 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-800">
                            <Camera className="w-3 h-3 text-white" />
                          </div>
                        </div> */}
                        <img
                          ref={profileImgRef} // ✅ ADD THIS LINE
                          src={user.picture}
                          alt="Profile"
                          className="w-20 h-20 rounded-full border border-gray-300 cursor-pointer"
                          onClick={toggleProfileModal}
                        />
                      </div>

                      {/* Greeting */}
                      <h2 className="text-black text-lg font-normal mb-2">
                        Hi, {user.name}!
                      </h2>

                      {/* Manage Account Button */}
                      <button className="bg-transparent border border-gray-500 text-blue-900 px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-700 transition-all duration-200 w-[80%] max-w-xs">
                        Manage your Google Account
                      </button>
                    </div>

                    {/* Account Actions */}
                    {/* <div className="p-2 border-t border-gray-200">
                      <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add account
                      </button>
                      <button
                        className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                        onClick={logout}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div> */}

                    {/* <div className="px-4 ">
                      <div className="flex gap-2">
                        <button className="flex-1 bg-gray-900 hover:bg-gray-700 text-white px-4 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200">
                          <Plus className="w-4 h-4" />
                          Add account
                        </button>
                        <button className="flex-1 bg-gray-900 hover:bg-gray-700 text-white px-4 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200">
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div> */}
                    <div className="px-4">
                      <div className="flex gap-0  overflow-hidden rounded-full border border-gray-700 bg-[#202124]">
                        <button className="flex-1 text-white px-5 py-4 border-r flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#3c4043] transition-all duration-200 rounded-l-full">
                          <Plus className="w-4 h-4" />
                          Add account
                        </button>
                        <button onClick={logout} className="flex-1 text-white px-5 py-4  flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#3c4043] transition-all duration-200 rounded-r-full">
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>

                    {/* Footer Links */}
                    {/* <div className="p-2 border-t border-gray-200 flex justify-between">
                      <a
                        href="#"
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Privacy Policy
                      </a>
                      <a
                        href="#"
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Terms of Service
                      </a>
                    </div> */}
                    <div className="px-2 py-2 border-gray-700">
                      <div className="flex justify-center gap-2">
                        <button className="text-gray-800 text-xs ">
                          Privacy Policy
                        </button>
                        <span className="text-gray-600">•</span>
                        <button className="text-gray-800 text-xs">
                          Terms of Service
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!user && (
              <div className="text-sm text-gray-500">
                <UserRoundXIcon />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
