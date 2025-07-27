import React, { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    setLoading(true);
    console.log("hiiiiiiiiiiii")

    // Check if token exists
    const token = localStorage.getItem("token");
    console.log("BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);


    if (token) {
      console.log("🔐 Token found in localStorage. Navigating to dashboard...");
      navigate("/dashboard");
    } else {
      console.log("🔐 No token found. Redirecting to Google login...");
      window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
    }
  };

  useEffect(() => {
    // Optional: auto-login if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, []);

  return (
    <div className="min-h-screen md:bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center md:p-4">
      <div className="w-full max-w-md  ">
        {/* Main Login Card - All Content in One Box */}
        <div className="bg-white rounded-3xl md:shadow-2xl  md:border md:border-gray-100 p-5 md:p-10 backdrop-blur-sm text-center space-y-8 md:space-y-6">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* App Title & Description */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900">MailMind</h1>
              <p className="text-gray-600 text-sm">
                AI-powered email prioritization and insights
              </p>
            </div>

            <div className="space-y-4 md:hidden">
              {/* Feature Card 1 */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    Smart Prioritization
                  </h4>
                  <p className="text-gray-500 text-xs">
                    AI identifies your most important emails automatically
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    Time Saving
                  </h4>
                  <p className="text-gray-500 text-xs">
                    Focus on what matters most in your inbox
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    Smart Insights
                  </h4>
                  <p className="text-gray-500 text-xs">
                    Get actionable insights about your email patterns
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm">
                  Successfully logged in! Redirecting...
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group transform"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="text-gray-700 text-sm font-semibold">
                {loading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>

            {/* Footer Text */}
            <div className=" pt-2 md:pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our
                <a href="/terms" className="text-blue-600 hover:underline mx-1">
                  Terms of Service
                </a>
                and
                <a
                  href="/privacy"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            <div class="security-note md:hidden">
              <svg viewBox="0 0 24 24">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
              </svg>
              Your data stays private and secure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
