import React, { useState, useEffect } from "react";
import { X, User, Award, FileText } from "lucide-react";

const ContributionForm = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  users,
  activities,
}) => {
  const [formData, setFormData] = useState({
    member_id: "",
    activity_id: "",
    description: "",
    points: 10,
    contribution_type: "participation",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState([]);

  useEffect(() => {
    if (!currentUser || !users) return;

    console.log("ContributionForm - Current user:", currentUser);
    console.log("ContributionForm - Current user role:", currentUser.role);

    let eligible = [];

    if (!currentUser.role) {
      console.error("Current user has no role defined");
      setEligibleUsers([]);
      return;
    }

    switch (currentUser.role) {
      case "admin":
        eligible = users.filter((user) => user.id !== currentUser.id);
        break;
      case "president":
        eligible = users.filter((user) => user.id !== currentUser.id);
        break;
      case "vice_president":
        eligible = users.filter(
          (user) =>
            user.id !== currentUser.id &&
            ["treasurer", "senior_executive", "member"].includes(user.role),
        );
        break;
      case "treasurer":
        eligible = users.filter(
          (user) =>
            user.id !== currentUser.id &&
            ["vice_president", "senior_executive", "member"].includes(
              user.role,
            ),
        );
        break;
      case "senior_executive":
        eligible = users.filter(
          (user) => user.id !== currentUser.id && user.role === "member",
        );
        break;
      default:
        eligible = [];
    }

    console.log("ContributionForm - Eligible users:", eligible);
    setEligibleUsers(eligible);
  }, [currentUser, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.member_id || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate points range
    const points = parseInt(formData.points);
    if (points < 1 || points > 100) {
      alert("Points must be between 1 and 100");
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        points: points,
        date: new Date().toISOString().split("T")[0],
        activity_id: formData.activity_id || null,
        member_id: formData.member_id || null,
      };

      console.log("Submitting contribution data:", submitData);

      await onSubmit(submitData);

      // Reset form
      setFormData({
        member_id: "",
        activity_id: "",
        description: "",
        points: 10,
        contribution_type: "participation",
      });
      onClose();
    } catch (error) {
      console.error("Error creating contribution:", error);
      alert("Error creating contribution: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPointsSuggestion = (type) => {
    const suggestions = {
      participation: 10,
      presentation: 20,
      leadership: 25,
      competition_win: 50,
      competition_runner_up: 30,
      project_completion: 40,
      mentoring: 15,
      organizing: 35,
    };
    return suggestions[type] || 10;
  };

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      contribution_type: type,
      points: getPointsSuggestion(type),
    });
  };

  const handlePointsChange = (value) => {
    const points = parseInt(value);
    if (points > 100) {
      setFormData({ ...formData, points: 100 });
    } else if (points < 1) {
      setFormData({ ...formData, points: 1 });
    } else {
      setFormData({ ...formData, points: value });
    }
  };

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Profile Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              Your profile data is not loaded. Please refresh the page and try
              again.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Record Contribution
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.member_id}
                onChange={(e) =>
                  setFormData({ ...formData, member_id: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a member</option>
                {eligibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role.replace("_", " ")}) -{" "}
                    {user.points} points
                  </option>
                ))}
              </select>
            </div>
            {eligibleUsers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No eligible members based on your role permissions. Your role:{" "}
                {currentUser.role}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Activity (Optional)
            </label>
            <select
              value={formData.activity_id}
              onChange={(e) =>
                setFormData({ ...formData, activity_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not related to any activity</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title} - {activity.date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Type
            </label>
            <select
              value={formData.contribution_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="participation">Event Participation</option>
              <option value="presentation">Gave Presentation</option>
              <option value="leadership">Leadership Role</option>
              <option value="competition_win">Competition Winner</option>
              <option value="competition_runner_up">
                Competition Runner-up
              </option>
              <option value="project_completion">Project Completion</option>
              <option value="mentoring">Mentoring Others</option>
              <option value="organizing">Event Organizing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points to Award (1-100) *
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={formData.points}
                onChange={(e) => handlePointsChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
                required
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Suggested: {getPointsSuggestion(formData.contribution_type)}{" "}
                points for {formData.contribution_type.replace("_", " ")}
              </p>
              <p className="text-xs font-medium text-blue-600">
                Max: 100 points
              </p>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              💡 You'll also receive {Math.floor(parseInt(formData.points) * 0.1)} appreciation points for recording this!
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this member contributed..."
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !formData.member_id ||
                !formData.description ||
                eligibleUsers.length === 0
              }
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? "Recording..." : "Record Contribution"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionForm;
