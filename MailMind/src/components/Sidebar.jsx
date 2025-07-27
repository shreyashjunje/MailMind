import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Paperclip,
  Calendar,
  Bot,
  Settings,
  LogOut,

} from "lucide-react";
import useAuth from "../hooks/useAuth";

const Sidebar = () => {
  const location = useLocation();
  const {logout} =useAuth

  const menu = [
    { label: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
    { label: "Calendar", icon: <Calendar />, path: "/dashboard/calendar" },

    { label: "Important Emails", icon: <Mail />, path: "/emails" },
    { label: "Attachments", icon: <Paperclip />, path: "/dashboard/attachments" },
    { label: "Reminders", icon: <Calendar />, path: "/reminders" },
    { label: "AI Assistant", icon: <Bot />, path: "/assistant" },
    { label: "Settings", icon: <Settings />, path: "/settings" },
    // { label: "Logout", icon: <LogOut />, path: "/logout" },
  ];

  return (
    <div className="hidden  lg:block w-64 min-h-screen  bg-white border-r shadow-md p-4 space-y-4">
      {/* <div className="text-2xl font-bold text-blue-600 mb-6">📬 MailMind</div> */}

      <ul className="space-y-2">
        {menu.map((item) => (
          <li key={item.label}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all
                ${
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700"
                }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="text-lg">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
    </div>
  );
};

export default Sidebar;
