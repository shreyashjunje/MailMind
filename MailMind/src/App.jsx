// import { Router } from "lucide-react";

import { Route, Routes } from "react-router";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
// import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import CalendarPage from "./pages/Calender";

function App() {
  return (
    <AuthProvider>
      <div className="text-3xl">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          {/* Protected Layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<CalendarPage />} />

            {/* <Route path="emails" element={<Emails />} /> */}
            {/* <Route path="attachments" element={<Attachments />} /> */}
            {/* Add more nested routes here */}
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
