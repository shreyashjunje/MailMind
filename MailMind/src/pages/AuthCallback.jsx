// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ✅ Get params from URL
    const params = new URLSearchParams(location.search);
    const name = params.get("name");
    const email = params.get("email");
    const picture = params.get("picture");

    // ✅ Set user in Context
    if (name && email && picture) {
      setUser({ name, email, picture });
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [location, navigate, setUser]);

  return (
    <div className="text-center mt-20 text-xl font-semibold">
      Logging you in securely... 🔐
    </div>
  );
};

export default AuthCallback;
