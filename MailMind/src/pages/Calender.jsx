import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import enUS from "date-fns/locale/en-US";
import axios from "axios";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  Filter,
} from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarPage = () => {
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Event type colors
  const eventTypeColors = {
    interview: "#ef4444",
    meeting: "#3b82f6",
    reminder: "#f59e0b",
    appointment: "#10b981",
    social: "#8b5cf6",
  };

  const eventTypeIcons = {
    interview: "💼",
    meeting: "👥",
    reminder: "⏰",
    appointment: "🏥",
    social: "🍽️",
  };

  // Fetch events from backend
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFetchError("You must be logged in to view events.");
        console.error("No token found");
        return;
      }
      const res = await axios.get("http://localhost:5000/api/events", {
        headers: { Authorization: `Bearer ${token}` },
        "Content-Type": "application/json",
      });

      console.log("Fetched events:", res.data);
      const normalized = res.data.events.map((evt) => ({
        ...evt,
        start: new Date(evt.start),
        end: new Date(evt.end),
        type: evt.type || "meeting",
        priority: evt.priority || "low",
      }));
      setEvents(normalized);
    } catch (err) {
      console.error("Failed to load events:", err);
      setFetchError("Unable to load calendar events.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // optional: poll every minute
    const interval = setInterval(fetchEvents, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter events based on type
  const filteredEvents =
    filterType === "all"
      ? events
      : events.filter((event) => event.type === filterType);

  // Event style getter
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: eventTypeColors[event.type] || "#666",
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0",
        display: "block",
        fontSize: "12px",
        fontWeight: "500",
        padding: "2px 4px",
      },
    };
  };

  // Event selection handler
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  console.log("Filtered events...............:", filteredEvents);

  // Today's events
  const todayEvents = events.filter((event) => {
    const eventDate = new Date(event.start);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  // This week's events count
  const thisWeekEvents = filteredEvents.filter((event) => {
    const eventDate = new Date(event.start);
    const weekStart = startOfWeek(new Date());
    const weekEnd = addDays(weekStart, 7);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

  // Retry sync to Google Calendar
  const retrySyncGoogle = async (event) => {
    if (!event || !event._id) return;
    try {
      console.log("Resyncing event to Google Calendar:", event);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/events/${event._id}/sync-google`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Sync response:", response.data);
      await fetchEvents();
      const updated = events.find((e) => e._id === event._id);
      setSelectedEvent(updated || event);
    } catch (e) {
      console.error("Resync failed", e.response?.data || e.message);
      alert(
        `Failed to resync to Google Calendar: ${
          e.response?.data?.error || e.message
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Custom Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Calendar
                      </h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setDate(
                            new Date(date.getFullYear(), date.getMonth() - 1)
                          )
                        }
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <span className="text-lg font-semibold text-gray-700 min-w-[120px] text-center">
                        {format(date, "MMMM yyyy")}
                      </span>
                      <button
                        onClick={() =>
                          setDate(
                            new Date(date.getFullYear(), date.getMonth() + 1)
                          )
                        }
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Events</option>
                        <option value="interview">Interviews</option>
                        <option value="meeting">Meetings</option>
                        <option value="reminder">Reminders</option>
                        <option value="appointment">Appointments</option>
                        <option value="social">Social</option>
                      </select>
                    </div>

                    <div className="flex bg-gray-100 rounded-md p-1">
                      {["month", "week", "day"].map((viewType) => (
                        <button
                          key={viewType}
                          onClick={() => setView(viewType)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            view === viewType
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="p-6">
                {loadingEvents ? (
                  <div className="p-6">Loading calendar...</div>
                ) : fetchError ? (
                  <div className="p-6 text-red-500">{fetchError}</div>
                ) : (
                  <div style={{ height: "600px" }}>
                    <Calendar
                      localizer={localizer}
                      events={filteredEvents}
                      startAccessor="start"
                      endAccessor="end"
                      view={view}
                      onView={setView}
                      date={date}
                      onNavigate={setDate}
                      onSelectEvent={handleSelectEvent}
                      eventPropGetter={eventStyleGetter}
                      components={{
                        toolbar: () => null, // Hide default toolbar
                      }}
                      formats={{
                        dateFormat: "d",
                        dayFormat: (date, culture, localizer) =>
                          localizer.format(date, "dddd", culture),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Events */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Today's Events
              </h3>
              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <div
                      key={event._id || event.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => handleSelectEvent(event)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">
                          {eventTypeIcons[event.type]}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {format(event.start, "h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No events today</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="font-semibold text-gray-900">
                    {filteredEvents.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold text-gray-900">
                    {thisWeekEvents.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">High Priority</span>
                  <span className="font-semibold text-red-600">
                    {
                      filteredEvents.filter(
                        (event) => event.priority === "high"
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Event Types Legend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Types
              </h3>
              <div className="space-y-2">
                {Object.entries(eventTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-sm text-gray-700 capitalize flex items-center gap-1">
                      {eventTypeIcons[type]} {type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {eventTypeIcons[selectedEvent.type]}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedEvent.title}
                    </h3>
                  </div>
                  {/* Sync status */}
                  {selectedEvent.syncedToGoogle ? (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      ✅ Synced to Google Calendar.{" "}
                      {selectedEvent.googleCalendarLink && (
                        <a
                          href={selectedEvent.googleCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-yellow-600 flex items-center gap-2">
                      ⏳ Not yet synced.{" "}
                      <button
                        onClick={() => retrySyncGoogle(selectedEvent)}
                        className="underline text-blue-600"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {format(selectedEvent.start, "MMM d, yyyy h:mm a")} -{" "}
                    {format(selectedEvent.end, "h:mm a")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedEvent.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedEvent.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : selectedEvent.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {selectedEvent.priority?.toUpperCase() || "LOW"} PRIORITY
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-700">
                    {selectedEvent.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Edit Event
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
