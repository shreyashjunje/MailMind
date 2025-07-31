import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

import {
  Mail,
  X,
  FileText,
  User,
  Clock,
  Reply,
  Share2,
  Paperclip,
  Minimize,
  Square,
  Maximize,
} from "lucide-react";

const EmailModal = ({
  showModal,
  selectedEmail,
  setShowModal,
  setShowReminderModal,
}) => {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    if (isFull) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFull]);

  if (!showModal || !selectedEmail) return null;

  function extractEmailAddress(fullString) {
    const match = fullString.match(/<([^>]+)>/);
    return match ? match[1] : fullString; // fallback to full string if no match
  }

  function extractName(fullString) {
    const match = fullString.match(/^([^<]+)</);
    return match ? match[1].trim() : fullString;
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long", // "Wednesday"
      year: "numeric", // "2025"
      month: "long", // "January"
      day: "numeric", // "15"
      hour: "2-digit", // "02"
      minute: "2-digit", // "30"
      hour12: true, // "PM"
    });
  }

  // helpers
  const isHtml = (str) =>
    typeof str === "string" && /<\/?[a-z][\s\S]*>/i.test(str);

  // extract common "view web version" links (customize patterns if needed)
  const extractWebVersionLink = (text) => {
    if (!text) return null;
    const patterns = [
      /https?:\/\/t-info\.mail\.adobe\.com\/r\/\?id=[^\s"']+/i, // adobe style
      /https?:\/\/[^\s"']*view\s*web\s*version[^\s"']*/i, // generic phrase
      /https?:\/\/[^\s"']+\/webversion[^\s"']*/i,
    ];
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) return m[0].trim();
    }
    return null;
  };

  // linkify plain text URLs and preserve line breaks
  const linkifyPlainText = (text) => {
    if (!text) return "";
    const urlRegex =
      /((https?:\/\/)[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?)/gi;
    return text
      .replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`;
      })
      .replace(/\n/g, "<br/>");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={() => setShowModal(false)}
    >
      <div
        className={`
    bg-white rounded-xl shadow-2xl overflow-y-auto
    ${
      isFull
        ? "fixed inset-0 m-0 rounded-none w-full h-full"
        : "w-full max-w-5xl max-h-[90vh]"
    }
  `}
        onClick={(e) => e.stopPropagation()}
        style={isFull ? { borderRadius: 0 } : {}}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Email Details
            </h2>
          </div>
          <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFull((f) => !f)}
            className="text-gray-500 hover:text-gray-700 transition-colors px-2"
          >
            {isFull ? <Minimize /> : <Maximize />}
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-gray-800">
          {/* Subject */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  {selectedEmail.subject}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatDate(selectedEmail.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Email Info */}
          <div className="space-y-4 text-gray-800">
            {/* Sender Name + Email */}
            <div className="flex items-start space-x-2">
              <User className="w-5 h-5 mt-0.5 text-gray-500" />
              <div>
                <p className="font-semibold">
                  {extractName(selectedEmail.from)}
                </p>
                <p className="text-gray-500">
                  {extractEmailAddress(selectedEmail.from)}
                </p>
              </div>
            </div>

            {/* To */}
            <div className="flex items-start space-x-2">
              <Mail className="w-5 h-5 mt-0.5 text-gray-500" />
              <div>
                <p className="text-gray-500 font-medium">To:</p>
                <p>{selectedEmail.userEmail}</p>
              </div>
            </div>

            {/* CC */}
            {selectedEmail && (
              <div className="flex items-start space-x-2">
                <Mail className="w-5 h-5 mt-0.5 text-gray-500" />
                <div>
                  <p className="text-gray-500 font-medium">CC:</p>
                  <p>{selectedEmail.cc || "No cc"}</p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-700">
                {/* {new Date(selectedEmail.timestamp).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })} */}
                {formatDate(selectedEmail.date)}
              </p>
            </div>
          </div>

          {/* Email Body */}
          {/* Email Body */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Message Content
            </label>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="prose prose-sm max-w-none text-gray-800">
                {/* Web version link if present */}
                {(() => {
                  const source =
                    selectedEmail.htmlBody || selectedEmail.body || "";
                  const webVersionLink = extractWebVersionLink(source);
                  return webVersionLink ? (
                    <div className="mb-2">
                      <a
                        href={webVersionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 underline"
                      >
                        View web version
                      </a>
                    </div>
                  ) : null;
                })()}

                {/* Render content */}
                {selectedEmail.htmlBody && isHtml(selectedEmail.htmlBody) ? (
                  <div
                    className="email-html-content"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedEmail.htmlBody),
                    }}
                  />
                ) : selectedEmail.body ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: linkifyPlainText(selectedEmail.body),
                    }}
                  />
                ) : (
                  <p className="text-gray-500">No content</p>
                )}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {selectedEmail.attachments?.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Attachments
              </label>
              <ul className="space-y-1">
                {selectedEmail.attachments.map((file, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <a
                      href={file.url}
                      download
                      className="text-blue-600 hover:underline"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium">
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </button>
            <button className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium">
              <Share2 className="w-4 h-4 mr-1" />
              Forward
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                setShowReminderModal(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Set Reminder</span>
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
