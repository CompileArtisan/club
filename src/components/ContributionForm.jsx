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

  // Define contribution hierarchy based on user role
  useEffect(() => {
    if (!currentUser || !users) return;

    let eligible = [];

    switch (currentUser.role) {
      case "president":
        // President can create contributions for anyone
        eligible = users.filter((user) => user.id !== currentUser.id);
        break;

      case "vice_president":
        // VP can create for treasurer, senior executives, and members
        eligible = users.filter(
          (user) =>
            user.id !== currentUser.id &&
            ["treasurer", "senior_executive", "member"].includes(user.role),
        );
        break;

      case "treasurer":
        // Treasurer can create for VP, senior executives, and members
        eligible = users.filter(
          (user) =>
            user.id !== currentUser.id &&
            ["vice_president", "senior_executive", "member"].includes(
              user.role,
            ),
        );
        break;

      case "senior_executive":
        // Senior executives can only create for members
        eligible = users.filter(
          (user) => user.id !== currentUser.id && user.role === "member",
        );
        break;

      default:
        eligible = [];
    }

    setEligibleUsers(eligible);
  }, [currentUser, users]);

  const handleSubmit = async () => {
    if (!formData.member_id || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        ...formData,
        points: parseInt(formData.points),
        date: new Date().toISOString().split("T")[0],
      });

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

  if (!isOpen) return null;

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
                No eligible members based on your role permissions.
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
              Points to Award
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Suggested: {getPointsSuggestion(formData.contribution_type)}{" "}
              points for {formData.contribution_type.replace("_", " ")}
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
                isLoading || !formData.member_id || !formData.description
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
