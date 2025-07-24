import React, { useEffect, useState } from "react";
import axios from "axios";

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    console.log("Fetching emails from the last 30 days...");
    try {
      const token = localStorage.getItem("token"); // if you're using JWT auth
    //   const res = await axios.get("/api/attachments", {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   });

      const response = await axios.get("http://localhost:5000/attachments", {
        withCredentials: true, // only if you're using cookies/session
      });
      console.log("Response data:", res.data), setEmails(res.data.emails);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  if (loading) return <p>Loading emails...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Emails from Last 30 Days</h2>
      {emails.length === 0 ? (
        <p>No emails found.</p>
      ) : (
        <ul className="space-y-4">
          {emails.map((email) => (
            <li
              key={email.id}
              className="p-4 border rounded-lg shadow-sm bg-white"
            >
              <p className="font-semibold">
                Subject:{" "}
                {email.payload?.headers?.find((h) => h.name === "Subject")
                  ?.value || "No Subject"}
              </p>
              <p>
                From:{" "}
                {email.payload?.headers?.find((h) => h.name === "From")
                  ?.value || "Unknown"}
              </p>
              <p>
                Date:{" "}
                {email.payload?.headers?.find((h) => h.name === "Date")
                  ?.value || "Unknown"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmailList;
