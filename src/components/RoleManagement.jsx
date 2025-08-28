import React, { useState, useEffect } from "react";
import { Users, Shield, Crown, DollarSign, Star, User, X } from "lucide-react";
import { useStore } from "../store/useStore";

const RoleManagement = ({ isOpen, onClose, session }) => {
  const { members, updateUserRole, fetchMembers } = useStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  // Fixed role hierarchy (higher number = higher privilege)
  const roleHierarchy = {
    member: 0,
    senior_executive: 1,
    treasurer: 2,
    vice_president: 3,
    president: 4,
    admin: 5,
  };

  const roleIcons = {
    admin: Crown,
    president: Crown,
    vice_president: Shield,
    treasurer: DollarSign,
    senior_executive: Star,
    member: User,
  };

  const roleColors = {
    admin: "text-purple-600 bg-purple-100",
    president: "text-red-600 bg-red-100",
    vice_president: "text-blue-600 bg-blue-100",
    treasurer: "text-green-600 bg-green-100",
    senior_executive: "text-orange-600 bg-orange-100",
    member: "text-gray-600 bg-gray-100",
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  // Get current user's role
  const currentUser = members.find((m) => m.id === session?.user?.id);
  const currentUserRole = currentUser?.role || "member";

  // Fixed: Proper role management logic
  const canManageRole = (managerRole, targetRole) => {
    const managerLevel = roleHierarchy[managerRole] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;

    // Admin can manage everyone except other admins
    if (managerRole === "admin") {
      return targetRole !== "admin";
    }

    // Others can manage roles below them
    return managerLevel > targetLevel;
  };

  // Fixed: Show users that can be managed
  const filteredMembers = members.filter((member) => {
    // Don't show the current user in the management list
    if (member.id === session?.user?.id) return false;

    // Show members that the current user can manage
    return canManageRole(currentUserRole, member.role);
  });

  // Fixed: Get available roles for assignment
  const getAvailableRoles = (currentUserRole) => {
    const allRoles = [
      { value: "member", label: "Member" },
      { value: "senior_executive", label: "Senior Executive" },
      { value: "treasurer", label: "Treasurer" },
      { value: "vice_president", label: "Vice President" },
      { value: "president", label: "President" },
      { value: "admin", label: "Administrator" },
    ];

    // FIXED: Admin can assign ANY role except admin
    if (currentUserRole === "admin") {
      return allRoles.filter((role) => role.value !== "admin");
    }

    // For non-admin roles, they can only assign roles below them
    const managerLevel = roleHierarchy[currentUserRole] || 0;

    return allRoles.filter((role) => {
      const roleLevel = roleHierarchy[role.value] || 0;
      return roleLevel < managerLevel;
    });
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return;

    setLoading(true);
    try {
      await updateUserRole(selectedUser.id, newRole);
      setSelectedUser(null);
      setNewRole("");
      await fetchMembers(); // Refresh the list
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = getAvailableRoles(currentUserRole);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Role Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your Role
            </h3>
            <div className="flex items-center space-x-2">
              {React.createElement(roleIcons[currentUserRole] || User, {
                className: "w-5 h-5",
              })}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[currentUserRole]}`}
              >
                {currentUserRole
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              You can only manage users with lower roles than yours.
            </p>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users available to manage
              </h3>
              <p className="text-gray-600">
                {members.length <= 1
                  ? "There are no other members in the system yet."
                  : "You can only manage users with lower roles than yours."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Manageable Users ({filteredMembers.length})
              </h3>

              <div className="grid gap-4">
                {filteredMembers.map((member) => {
                  const RoleIcon = roleIcons[member.role] || User;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(member.full_name || member.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {member.full_name || member.username}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <RoleIcon className="w-4 h-4" />
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}
                            >
                              {member.role
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span className="text-sm text-gray-500">
                              {member.points} points • {member.level}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedUser(member);
                          setNewRole(member.role);
                        }}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Manage Role
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Role Update Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Update Role for{" "}
                  {selectedUser.full_name || selectedUser.username}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Role
                    </label>
                    <div className="flex items-center space-x-2">
                      {React.createElement(
                        roleIcons[selectedUser.role] || User,
                        {
                          className: "w-5 h-5",
                        },
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[selectedUser.role]}`}
                      >
                        {selectedUser.role
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setNewRole("");
                      }}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRoleUpdate}
                      disabled={loading || newRole === selectedUser.role}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Updating..." : "Update Role"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
