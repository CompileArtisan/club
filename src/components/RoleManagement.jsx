import React, { useState } from "react";
import { Shield, User, Crown, Star, UserCheck, X } from "lucide-react";

const RoleManagement = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onUpdateRole,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const roles = [
    {
      value: "member",
      label: "Member",
      icon: User,
      description: "Basic member access",
    },
    {
      value: "senior_executive",
      label: "Senior Executive",
      icon: UserCheck,
      description: "Can manage members and record contributions",
    },
    {
      value: "treasurer",
      label: "Treasurer",
      icon: Star,
      description: "Financial oversight and contribution management",
    },
    {
      value: "vice_president",
      label: "Vice President",
      icon: Shield,
      description: "Deputy leadership with most administrative privileges",
    },
    {
      value: "president",
      label: "President",
      icon: Crown,
      description: "Full administrative access",
    },
  ];

  // Define role hierarchy for permissions
  const roleHierarchy = {
    president: 5,
    vice_president: 4,
    treasurer: 3,
    senior_executive: 2,
    member: 1,
  };

  // Check if current user can change target user's role
  const canChangeRole = (targetUser, targetRole) => {
    if (!currentUser || !targetUser) return false;

    const currentUserLevel = roleHierarchy[currentUser.role] || 0;
    const targetUserLevel = roleHierarchy[targetUser.role] || 0;
    const newRoleLevel = roleHierarchy[targetRole] || 0;

    // Only presidents can create other presidents
    if (targetRole === "president" && currentUser.role !== "president")
      return false;

    // Users can only manage users with lower hierarchy levels
    // And can only assign roles equal to or lower than their own level
    return (
      currentUserLevel > targetUserLevel && currentUserLevel >= newRoleLevel
    );
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole || !canChangeRole(selectedUser, newRole))
      return;

    setIsUpdating(true);
    try {
      await onUpdateRole(selectedUser.id, newRole);
      setSelectedUser(null);
      setNewRole("");
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleIcon = (role) => {
    const roleData = roles.find((r) => r.value === role);
    const IconComponent = roleData?.icon || User;
    return <IconComponent className="w-4 h-4" />;
  };

  const getRoleColor = (role) => {
    const colors = {
      president: "text-purple-700 bg-purple-100 border-purple-300",
      vice_president: "text-blue-700 bg-blue-100 border-blue-300",
      treasurer: "text-green-700 bg-green-100 border-green-300",
      senior_executive: "text-orange-700 bg-orange-100 border-orange-300",
      member: "text-gray-700 bg-gray-100 border-gray-300",
    };
    return colors[role] || colors.member;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Users that current user can manage
  const manageableUsers = filteredUsers.filter((user) => {
    if (user.id === currentUser.id) return false; // Can't change own role
    const currentUserLevel = roleHierarchy[currentUser.role] || 0;
    const targetUserLevel = roleHierarchy[user.role] || 0;
    return currentUserLevel > targetUserLevel;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Role Management
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* User List */}
          <div className="w-1/2 border-r">
            <div className="p-4 border-b bg-gray-50">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">
                Showing {manageableUsers.length} manageable users
              </p>
            </div>

            <div className="overflow-y-auto h-full p-4 space-y-3">
              {manageableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No users available to manage</p>
                  <p className="text-sm">
                    You can only manage users with lower roles than yours
                  </p>
                </div>
              ) : (
                manageableUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole(user.role);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition duration-200 ${
                      selectedUser?.id === user.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.username}
                        </p>
                        {user.full_name && (
                          <p className="text-sm text-gray-500">
                            {user.full_name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {user.points} points
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}
                        >
                          {getRoleIcon(user.role)}
                          <span className="ml-1">
                            {roles.find((r) => r.value === user.role)?.label}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="w-1/2 p-6">
            {selectedUser ? (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Managing: {selectedUser.username}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Current role:{" "}
                    {roles.find((r) => r.value === selectedUser.role)?.label}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select New Role
                  </label>

                  {roles.map((role) => {
                    const canAssign = canChangeRole(selectedUser, role.value);
                    const IconComponent = role.icon;

                    return (
                      <div
                        key={role.value}
                        onClick={() => canAssign && setNewRole(role.value)}
                        className={`p-4 rounded-lg border cursor-pointer transition duration-200 ${
                          newRole === role.value
                            ? "border-blue-500 bg-blue-50"
                            : canAssign
                              ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg mr-3 ${getRoleColor(role.value)}`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {role.label}
                            </p>
                            <p className="text-sm text-gray-600">
                              {role.description}
                            </p>
                          </div>
                          {newRole === role.value && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setNewRole("");
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRoleUpdate}
                    disabled={
                      isUpdating ||
                      !newRole ||
                      newRole === selectedUser.role ||
                      !canChangeRole(selectedUser, newRole)
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Updating..." : "Update Role"}
                  </button>
                </div>

                {newRole !== selectedUser.role &&
                  canChangeRole(selectedUser, newRole) && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800">
                        <strong>Warning:</strong> This will change{" "}
                        {selectedUser.username}'s role from{" "}
                        <span className="font-medium">
                          {
                            roles.find((r) => r.value === selectedUser.role)
                              ?.label
                          }
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {roles.find((r) => r.value === newRole)?.label}
                        </span>
                        . This action cannot be undone without admin
                        intervention.
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a user to manage their role</p>
                <p className="text-sm mt-2">Choose from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
