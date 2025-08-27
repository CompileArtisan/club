import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Users,
  UserPlus,
  UserMinus,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const ActivityRegistration = ({
  isOpen,
  onClose,
  activity,
  currentUser,
  onRegister,
  onUnregister,
}) => {
  const [participants, setParticipants] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activity) {
      fetchParticipants();
    }
  }, [isOpen, activity]);

  const fetchParticipants = async () => {
    if (!activity) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_participants")
        .select(
          `
          *,
          member:profiles!activity_participants_member_id_fkey(id, username, full_name, role, points, level)
        `,
        )
        .eq("activity_id", activity.id);

      if (error) throw error;

      setParticipants(data || []);
      setIsRegistered(
        (data || []).some((p) => p.member_id === currentUser?.id),
      );
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!currentUser || !activity) return;

    setRegistrationLoading(true);
    try {
      if (isRegistered) {
        const { error } = await onUnregister(activity.id);
        if (!error) {
          setIsRegistered(false);
          await fetchParticipants();
          toast.success("Successfully unregistered from activity");
        }
      } else {
        const { error } = await onRegister(activity.id);
        if (!error) {
          setIsRegistered(true);
          await fetchParticipants();
          toast.success("Successfully registered for activity");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to update registration");
    } finally {
      setRegistrationLoading(false);
    }
  };

  const getParticipantStatusIcon = (status) => {
    switch (status) {
      case "attended":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "absent":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "attended":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "text-purple-700 bg-purple-100",
      president: "text-blue-700 bg-blue-100",
      vice_president: "text-indigo-700 bg-indigo-100",
      treasurer: "text-green-700 bg-green-100",
      senior_executive: "text-orange-700 bg-orange-100",
      member: "text-gray-700 bg-gray-100",
    };
    return colors[role] || colors.member;
  };

  const isActivityFull =
    activity?.max_participants &&
    participants.filter((p) => p.status === "registered").length >=
      activity.max_participants;

  const canRegister =
    currentUser &&
    !isRegistered &&
    (!isActivityFull || activity?.max_participants === null);
  const isUpcoming = activity && new Date(activity.date) >= new Date();

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {activity.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Activity Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Activity Details
            </h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{activity.date}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Type:</span>
                <span className="capitalize">{activity.type}</span>
              </div>
              {activity.max_participants && (
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Max Participants: {activity.max_participants}</span>
                </div>
              )}
              {activity.description && (
                <div className="mt-3">
                  <span className="font-medium text-gray-900">
                    Description:
                  </span>
                  <p className="text-gray-600 mt-1">{activity.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Registration Status */}
          {isUpcoming && currentUser && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {isRegistered
                    ? "You are registered for this activity"
                    : "Registration Status"}
                </p>
                {!isRegistered && (
                  <p className="text-sm text-gray-600">
                    {isActivityFull
                      ? "This activity is full"
                      : "Click to register for this activity"}
                  </p>
                )}
              </div>
              <button
                onClick={handleRegistration}
                disabled={
                  registrationLoading || (!isRegistered && !canRegister)
                }
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isRegistered
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : canRegister
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {registrationLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : isRegistered ? (
                  <UserMinus className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {registrationLoading
                  ? "Processing..."
                  : isRegistered
                    ? "Unregister"
                    : "Register"}
              </button>
            </div>
          )}

          {/* Participants List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Participants ({participants.length}
                {activity.max_participants && ` / ${activity.max_participants}`}
                )
              </h4>
              {isActivityFull && (
                <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                  Full
                </span>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                <p className="text-gray-500">Loading participants...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No participants yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {participant.member?.username
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {participant.member?.username || "Unknown User"}
                          {participant.member_id === currentUser?.id && (
                            <span className="text-sm text-blue-600 ml-1">
                              (You)
                            </span>
                          )}
                        </p>
                        {participant.member?.full_name && (
                          <p className="text-sm text-gray-500">
                            {participant.member.full_name}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(participant.member?.role)}`}
                          >
                            {participant.member?.role?.replace("_", " ") ||
                              "member"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {participant.member?.points || 0} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(participant.status)}`}
                      >
                        {getParticipantStatusIcon(participant.status)}
                        <span className="ml-1 capitalize">
                          {participant.status}
                        </span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(
                          participant.registered_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Stats */}
          {participants.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      participants.filter((p) => p.status === "registered")
                        .length
                    }
                  </p>
                  <p className="text-sm text-gray-600">Registered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {participants.filter((p) => p.status === "attended").length}
                  </p>
                  <p className="text-sm text-gray-600">Attended</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {participants.filter((p) => p.status === "absent").length}
                  </p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityRegistration;
