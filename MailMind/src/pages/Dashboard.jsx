import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  Search,
  Link2,
  CalendarCheck,
  Trash2,
  Edit3,
  StickyNote,
  Volume2,
  Calendar,
  Clock,
  User,
  Tag,
  AlertCircle,
  Plus,
  X,
  Eye,
  Mail,
  Bell,
  MessageSquare,
  Smartphone,
  FileText,
  Send,
} from "lucide-react";
import axios from "axios";
import EmailModal from "../components/modals/EmailModal";

const Dashboard = () => {
  const [emails, setEmails] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [emailNotes, setEmailNotes] = useState({});
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEmail, setReminderEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [showSenderPriorityModal, setShowSenderPriorityModal] = useState(false);
  const [senderPriorityRules, setSenderPriorityRules] = useState([]);
  const [newRule, setNewRule] = useState({ email: "", priority: "high" });

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageSquare,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: Mail,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: "sms",
      name: "SMS",
      icon: Smartphone,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  // const hideSender = async (sender) => {
  //         const token = localStorage.getItem("token");

  //   await fetch(`http://localhost:5000/emails/hide-sender`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //     body: JSON.stringify({ sender }),
  //   });

  //   // Optional: Refresh the email list
  // };

  // const determinePriority = (email) => {
  //   if (!email) return "low";

  //   const text = `${email.subject || ""} ${
  //     email.summary || email.snippet || ""
  //   }`.toLowerCase();

  //   if (
  //     text.includes("interview") ||
  //     text.includes("offer") ||
  //     text.includes("test") ||
  //     text.includes("shortlisted") ||
  //     text.includes("urgent") ||
  //     text.includes("important") ||
  //     text.includes("assignment") ||
  //     text.includes("deadline") ||
  //     text.includes("exam") ||
  //     text.includes("action required") ||
  //     text.includes("immediate attention") ||
  //     text.includes("vodafone")
  //   ) {
  //     return "high";
  //   } else if (
  //     text.includes("reminder") ||
  //     text.includes("meeting") ||
  //     text.includes("schedule") ||
  //     text.includes("follow up")
  //   ) {
  //     return "medium";
  //   } else {
  //     return "low";
  //   }
  // };
  const hideSender = async (sender) => {
    await axios.post("/api/hide-sender", { sender });

    // Filter emails in frontend immediately
    setEmails((prev) => prev.filter((email) => email.from !== sender));
  };
  useEffect(() => {
    const savedRules = localStorage.getItem("senderPriorityRules");
    if (savedRules) {
      setSenderPriorityRules(JSON.parse(savedRules));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "senderPriorityRules",
      JSON.stringify(senderPriorityRules)
    );
  }, [senderPriorityRules]);

  useEffect(() => {
    const fetchSummaries = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get(
          "http://localhost:5000/emails/summaries",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Add priority to each email
        const emailsWithPriority = response.data.summaries.map((email) => ({
          ...email,
          priority: determinePriority(email),
        }));

        setEmails(emailsWithPriority);

        // setEmails(response.data.summaries);
      } catch (error) {
        console.error("Error fetching summaries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const determinePriority = (email) => {
    if (!email) return "low";

    // First check if sender has a custom priority rule
    if (email.from) {
      // Add this check
      const senderRule = senderPriorityRules.find((rule) =>
        email.from.toLowerCase().includes(rule.email.toLowerCase())
      );
      if (senderRule) return senderRule.priority;
    }

    // Then check the content-based rules
    const text = `${email.subject || ""} ${
      email.summary || email.snippet || ""
    }`.toLowerCase();

    if (
      text.includes("interview") ||
      text.includes("offer") ||
      text.includes("test") ||
      text.includes("shortlisted") ||
      text.includes("urgent") ||
      text.includes("important") ||
      text.includes("assignment") ||
      text.includes("deadline") ||
      text.includes("exam") ||
      text.includes("action required") ||
      text.includes("immediate attention") ||
      text.includes("vodafone")
    ) {
      return "high";
    } else if (
      text.includes("reminder") ||
      text.includes("meeting") ||
      text.includes("schedule") ||
      text.includes("follow up")
    ) {
      return "medium";
    } else {
      return "low";
    }
  };

  // Add new sender priority rule
  const addSenderPriorityRule = () => {
    if (newRule.email.trim() === "") return;
    setSenderPriorityRules([...senderPriorityRules, newRule]);
    setNewRule({ email: "", priority: "high" });
  };

  // Remove sender priority rule
  const removeSenderPriorityRule = (index) => {
    const updatedRules = [...senderPriorityRules];
    updatedRules.splice(index, 1);
    setSenderPriorityRules(updatedRules);
  };

  //   useEffect(() => {
  //   const interval = setInterval(() => {
  //     const fetchNewEmails = async () => {
  //       const token = localStorage.getItem("token");
  //       try {
  //         await axios.get("http://localhost:5000/emails/check-new", {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         });
  //         console.log("✅ Checked for new emails");
  //       } catch (err) {
  //         console.error("🔁 Failed to check new emails", err);
  //       }
  //     };

  //     fetchNewEmails();
  //   }, 5 * 60 * 1000); // every 5 minutes

  //   return () => clearInterval(interval);
  // }, []);

  // const filteredEmails = emails.filter(
  //   (email) =>
  //     email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     email.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.summary || "").toLowerCase().includes(searchQuery.toLowerCase());

    const priority = determinePriority(email);
    const matchesPriority =
      priorityFilter === "all" || priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const handleTextToSpeech = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser");
    }
  };

  const handleViewOriginal = (email) => {
    setSelectedEmail(email);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
  };

  const handleOpenReminder = (email) => {
    setReminderEmail(email);
    setShowReminderModal(true);
  };

  const handleCloseReminderModal = () => {
    setShowReminderModal(false);
    setReminderEmail(null);
  };

  const handleSendReminder = (type) => {
    if (!reminderEmail) return;

    const subject = `Reminder: ${reminderEmail.subject}`;
    const message = `Hi! This is a reminder about: ${reminderEmail.subject}\n\nSummary: ${reminderEmail.summary}\n\nReceived from: ${reminderEmail.from}`;

    switch (type) {
      case "whatsapp":
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          message
        )}`;
        window.open(whatsappUrl, "_blank");
        break;
      case "gmail":
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(message)}`;
        window.open(gmailUrl, "_blank");
        break;
      case "sms":
        const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, "_blank");
        break;
      default:
        break;
    }

    handleCloseReminderModal();
  };

  const handleAddToCalendar = (email) => {
    const eventTitle = email.subject;
    const eventDate =
      email.dates?.[0] || new Date().toISOString().split("T")[0];
    const eventDescription = email.summary || email.snippet;

    // Create a calendar event URL (Google Calendar)
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      eventTitle
    )}&dates=${encodeURIComponent(
      eventDate.replace(/-/g, "")
    )}T100000Z/${encodeURIComponent(
      eventDate.replace(/-/g, "")
    )}T110000Z&details=${encodeURIComponent(eventDescription)}`;

    window.open(calendarUrl, "_blank");
  };

  const handleDeleteEmail = (emailIndex) => {
    if (window.confirm("Are you sure you want to delete this email?")) {
      const updatedEmails = emails.filter((_, index) => index !== emailIndex);
      setEmails(updatedEmails);
    }
  };

  const handleEditEmail = (emailIndex) => {
    // In a real app, this would open an edit modal
    alert(`Edit functionality for email: ${emails[emailIndex].subject}`);
  };

  const handleAddNote = (emailIndex) => {
    setEditingNote(emailIndex);
    setNoteText(emailNotes[emailIndex] || "");
  };

  const handleSaveNote = (emailIndex) => {
    setEmailNotes((prev) => ({
      ...prev,
      [emailIndex]: noteText,
    }));
    setEditingNote(null);
    setNoteText("");
  };

  const handleCancelNote = () => {
    setEditingNote(null);
    setNoteText("");
  };

  const extractMeetingLinks = (text) => {
    if (!text) return [];
    const meetingRegex = /(https?:\/\/[^\s]+(?:zoom|meet|teams|webex)[^\s]*)/gi;
    return text.match(meetingRegex) || [];
  };

  const extractDeadlines = (text) => {
    if (!text) return [];
    const deadlineKeywords = [
      "deadline",
      "due date",
      "expires",
      "submit by",
      "closing date",
    ];
    return deadlineKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const priority = determinePriority(emails);

  return (
    <div className="p-5 max-w-6xl mx-auto ">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Email Dashboard
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Stay organized with your important emails and upcoming events
        </p>
      </div>

      {/* 🔍 Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
        />
      </div>

      <div className="flex gap-3 mb-6">
        {["all", "high", "medium", "low"].map((level) => (
          <button
            key={level}
            onClick={() => setPriorityFilter(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              priorityFilter === level
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setShowSenderPriorityModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          Manage Sender Priorities
        </button>
      </div>

      {/* 📩 Email Cards */}
      {filteredEmails.length > 0 ? (
        <ul className="space-y-4">
          {filteredEmails.map((email, idx) => {
            const meetingLinks = extractMeetingLinks(
              email.summary || email.snippet
            );
            const hasDeadline = extractDeadlines(
              email.summary || email.snippet
            );

            return (
              <li
                key={idx}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {email.subject}
                    </h3>
                    {/* From and Date */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{email.from || "Unknown sender"}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {formatDate(email.receivedDate || email.date)}
                        </span>
                      </div>
                    </div>
                    {/* Tags */}
                    {/* const priority = determinePriority(email) */}
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          determinePriority(email)
                        )}`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {determinePriority(email).charAt(0).toUpperCase() +
                          determinePriority(email).slice(1)}{" "}
                        Priority
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewOriginal(email)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View original message"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenReminder(email)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Set reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleTextToSpeech(email.summary || email.snippet)
                      }
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddNote(idx)}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Add note"
                    >
                      <StickyNote className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditEmail(idx)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(idx)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    className="text-sm"
                    onClick={() => hideSender(email.from)}
                  >
                    Hide all from this sender
                  </button>
                </div>

                {/* Summary */}
                {/* <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  {email.summary || email.snippet}
                </p> */}
                <div className="prose text-sm prose-sm text-gray-700 mb-4">
                  <ReactMarkdown>
                    {email.summary || email.snippet}
                  </ReactMarkdown>
                </div>

                {/* Note Section */}
                {editingNote === idx ? (
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add your note here..."
                      className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows="3"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSaveNote(idx)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Save Note
                      </button>
                      <button
                        onClick={handleCancelNote}
                        className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  emailNotes[idx] && (
                    <div className="bg-purple-50 p-4 rounded-lg mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-purple-800 font-medium text-sm mb-1">
                            Your Note:
                          </p>
                          <p className="text-purple-700 text-sm">
                            {emailNotes[idx]}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddNote(idx)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Content Sections */}
                <div className="space-y-3">
                  {/* Dates */}
                  {email.dates?.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <CalendarCheck className="w-4 h-4 mr-2" />
                        <span>
                          <strong>Date:</strong> {email.dates.join(", ")}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCalendar(email)}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Add to Calendar
                      </button>
                    </div>
                  )}

                  {/* Meeting Links */}
                  {meetingLinks.length > 0 && (
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm text-indigo-600 mb-2">
                        <Link2 className="w-4 h-4 mr-2" />
                        <strong>Meeting Links:</strong>
                      </div>
                      {meetingLinks.map((link, linkIdx) => (
                        <a
                          key={linkIdx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-indigo-700 hover:text-indigo-900 underline text-sm mb-1"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Regular Links */}
                  {email.links?.length > 0 && !meetingLinks.length && (
                    <div className="flex items-center text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                      <Link2 className="w-4 h-4 mr-2" />
                      <a
                        href={email.links[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-purple-800"
                      >
                        {email.links[0]}
                      </a>
                    </div>
                  )}

                  {/* Deadline Alert */}
                  {hasDeadline && (
                    <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>
                        <strong>Deadline Alert:</strong> This email contains
                        deadline information
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 text-lg">No important emails found.</p>
        </div>
      )}

      {showReminderModal && reminderEmail && (
        <div className="fixed text-sm inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Set Reminder
                </h2>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Email Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {reminderEmail.subject}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      To: {reminderEmail.recipient}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Reminder Date
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    min={getTomorrowDate()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Additional Note */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Note (Optional)
                </label>
                <textarea
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="Add any additional context for your reminder..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Platform
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`flex items-center justify-center space-x-3 p-4 rounded-lg transition-all ${
                          selectedPlatform === platform.id
                            ? platform.color + " text-white shadow-lg"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">
                          Send via {platform.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleSendReminder(selectedPlatform)}
                  disabled={!selectedPlatform || !reminderDate || !reminderTime}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Schedule Reminder</span>
                </button>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EmailModal
        showModal={showModal}
        selectedEmail={selectedEmail}
        setShowModal={setShowModal}
        setShowReminderModal={setShowReminderModal}
      />
      {/* Sender Priority Rules Modal */}
      {showSenderPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Sender Priority Rules
                </h2>
              </div>
              <button
                onClick={() => setShowSenderPriorityModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Rule
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule.email}
                    onChange={(e) =>
                      setNewRule({ ...newRule, email: e.target.value })
                    }
                    placeholder="Email or domain (e.g., 'hr@company.com' or '@important.com')"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <select
                    value={newRule.priority}
                    onChange={(e) =>
                      setNewRule({ ...newRule, priority: e.target.value })
                    }
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    onClick={addSenderPriorityRule}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Current Rules
                </h3>
                {senderPriorityRules.length === 0 ? (
                  <p className="text-gray-500 text-sm">No rules defined yet</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {senderPriorityRules.map((rule, index) => (
                      <li
                        key={index}
                        className="py-3 flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">{rule.email}</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${getPriorityColor(
                              rule.priority
                            )}`}
                          >
                            {rule.priority}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSenderPriorityRule(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSenderPriorityModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
