import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ✅ Full-width Navbar on Top */}
      <Navbar />

      {/* ✅ Sidebar and Main Content in a Row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Fixed Width) */}
        <Sidebar className="w-64" />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
