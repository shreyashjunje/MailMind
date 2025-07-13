import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        console.log("Fetching emails...");
        // Make sure to replace with your backend URL if different
        const res = await axios.get("http://localhost:5000/auth/emails");
        
        console.log("Res-->",res)
        setEmails(res.data.emails);
      } catch (err) {
        console.error("Failed to fetch emails", err);
      }
    };

    fetchEmails();
  }, []);

  return (
    <div className="p-5">
  
      <h1 className="text-xl font-bold mb-4">📬 Important Emails</h1>
      <ul>
        {emails.map((email, idx) => (
          <li key={idx} className="mb-3 p-3 border rounded bg-white shadow-sm">
            <p><strong>Subject:</strong> {email.subject}</p>
            <p><strong>From:</strong> {email.from}</p>
            <p><strong>Date:</strong> {email.date}</p>
            <p><strong>Body:</strong> {email.body.slice(0, 200)}...</p>

          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
