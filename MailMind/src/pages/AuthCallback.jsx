import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const AuthCallback = () => {
    const { login } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
            login(token);

      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Logging you in...</div>;
};

export default AuthCallback;
