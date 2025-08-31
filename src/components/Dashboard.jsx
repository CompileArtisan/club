import React, { useState, useEffect } from "react";
import {
  User,
  Plus,
  Award,
  Activity,
  Users,
  LogOut,
  Trophy,
  Calendar,
  FileText,
  AlertCircle,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Download,
  BarChart3,
  TrendingUp,
  Star,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import useStore from "../store/useStore";
import ActivityForm from "./ActivityForm";
import ContributionForm from "./ContributionForm";
import Leaderboard from "./Leaderboard";
import RoleManagement from "./RoleManagement";
import Notifications from "./Notifications";
import ActivityRegistration from "./ActivityRegistration";
import AnalyticsDashboard from "./AnalyticsDashboard";

const Dashboard = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityRegistration, setShowActivityRegistration] =
    useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const {
    profile,
    users,
    activities,
    contributions,
    activeTab,
    showActivityForm,
    showContributionForm,
    showRoleManagement,
    setActiveTab,
    setShowActivityForm,
    setShowContributionForm,
    setShowRoleManagement,
    canCreateActivity,
    canCreateContribution,
    canManageRoles,
    canEditActivity,
    canDeleteActivity,
    createActivity,
    createContribution,
    updateActivity,
    deleteActivity,
    updateUserRole,
    fetchProfile,
    fetchUsers,
    fetchActivities,
    fetchContributions,
    createProfile,
    exportData,
    getDetailedAnalytics,
    registerForActivity,
    unregisterFromActivity,
    setupRealTimeSubscriptions,
    cleanupRealTimeSubscriptions,
  } = useStore();

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) {
        setError("No user session found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Loading data for user:", session.user.id);

        // Fetch profile first and wait for it
        const profileResult = await fetchProfile(session.user.id);
        console.log("Profile fetch result:", profileResult);

        if (!profileResult) {
          try {
            const userData = {
              username:
                session.user.user_metadata?.username ||
                session.user.email?.split("@")[0] ||
                "user",
              fullName: session.user.user_metadata?.full_name || "",
            };
            await createProfile(session.user.id, userData);
            // Refetch the profile after creation
            await fetchProfile(session.user.id);
          } catch (createError) {
            console.error("Error creating profile:", createError);
            setShowProfileSetup(true);
          }
        }

        // Load other data
        await Promise.allSettled([
          fetchUsers(),
          fetchActivities(),
          fetchContributions(),
        ]);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setError(`Failed to load dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const subscriptions = setupRealTimeSubscriptions();
    return () => {
      cleanupRealTimeSubscriptions();
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    try {
      cleanupRealTimeSubscriptions();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfileSetup = async (setupData) => {
    try {
      await createProfile(session.user.id, setupData);
      await fetchProfile(session.user.id); // Refetch after creation
      setShowProfileSetup(false);
    } catch (error) {
      console.error("Error setting up profile:", error);
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setShowActivityForm(true);
  };

  const handleDeleteActivity = async (activity) => {
    if (
      window.confirm(`Are you sure you want to delete "${activity.title}"?`)
    ) {
      await deleteActivity(activity.id);
    }
  };

  const handleExport = async (type) => {
    await exportData(type);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: "Administrator",
      president: "President",
      vice_president: "Vice President",
      treasurer: "Treasurer",
      senior_executive: "Senior Executive",
      member: "Member",
    };
    return roleMap[role] || role;
  };

  const getLevelColor = (level) => {
    const colors = {
      Bronze: "text-amber-600 bg-amber-50 border-amber-200",
      Silver: "text-gray-600 bg-gray-50 border-gray-200",
      Gold: "text-yellow-600 bg-yellow-50 border-yellow-200",
      Platinum: "text-purple-600 bg-purple-50 border-purple-200",
    };
    return colors[level] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getUpcomingActivities = () => {
    const today = new Date();
    return activities
      .filter((activity) => new Date(activity.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const getRecentContributions = () => {
    return contributions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  const analytics = getDetailedAnalytics();

  // Show profile setup if needed
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">
              Setup Your Profile
            </h2>
            <p className="text-gray-600">
              Complete your club profile to continue
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleProfileSetup({
                username: formData.get("username"),
                fullName: formData.get("fullName"),
              });
            }}
            className="space-y-4"
          >
            <input
              name="username"
              type="text"
              placeholder="Username"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="fullName"
              type="text"
              placeholder="Full Name (Optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2 text-red-600">
            Error Loading Dashboard
          </div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg mb-2">Loading Dashboard...</div>
          <div className="text-sm text-gray-500">Please wait...</div>
        </div>
      </div>
    );
  }

  // Don't use fallback - if profile is null, show an error
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <div className="text-lg mb-2 text-red-600">Profile Not Found</div>
          <div className="text-sm text-gray-500 mb-4">
            Your profile could not be loaded. This may be a synchronization
            issue.
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchProfile(session.user.id).finally(() => setLoading(false));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => setShowProfileSetup(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Setup Profile
          </button>
        </div>
      </div>
    );
  }

  console.log("Dashboard rendering with profile:", profile);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CodeChef ASEB</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Notifications />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {profile.username} ({getRoleDisplayName(profile.role)})
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(
                    profile.level,
                  )}`}
                >
                  {profile.level}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: "dashboard", label: "Dashboard", icon: null },
              { key: "activities", label: "Activities", icon: Calendar },
              { key: "members", label: "Members", icon: Users },
              { key: "contributions", label: "Contributions", icon: FileText },
              { key: "leaderboard", label: "Leaderboard", icon: Trophy },
              ...(profile?.role === "admin" || profile?.role === "president"
                ? [{ key: "analytics", label: "Analytics", icon: BarChart3 }]
                : []),
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {IconComponent && <IconComponent className="w-4 h-4 mr-1" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">Your Points</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {profile.points}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Trophy className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">Your Level</h3>
                    <span
                      className={`px-3 py-1 rounded-full ${getLevelColor(profile.level)}`}
                    >
                      {profile.level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">Total Activities</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {activities.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-orange-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">Total Members</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      {users.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Activities */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Upcoming Activities</h3>
                </div>
                <div className="p-6">
                  {getUpcomingActivities().length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No upcoming activities</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getUpcomingActivities().map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {activity.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {activity.date}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowActivityRegistration(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Contributions */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">
                    Recent Contributions
                  </h3>
                </div>
                <div className="p-6">
                  {getRecentContributions().length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No recent contributions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecentContributions().map((contribution) => {
                        const member = users.find(
                          (u) => u.id === contribution.member_id,
                        );
                        return (
                          <div
                            key={contribution.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {member?.username || "Unknown"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {contribution.description}
                              </p>
                            </div>
                            <span className="text-green-600 font-semibold">
                              +{contribution.points}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Activities</h2>
              <div className="flex space-x-2">
                {canCreateActivity() && (
                  <button
                    onClick={() => setShowActivityForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Activity
                  </button>
                )}
                <button
                  onClick={() => handleExport("activities")}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {activities.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No activities found</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {activity.title}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {activity.date}
                          </span>
                          <span className="capitalize">{activity.type}</span>
                          {activity.max_participants && (
                            <span>Max: {activity.max_participants}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowActivityRegistration(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        {canEditActivity(activity) && (
                          <button
                            onClick={() => handleEditActivity(activity)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteActivity(activity) && (
                          <button
                            onClick={() => handleDeleteActivity(activity)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Members</h2>
              <div className="flex space-x-2">
                {canManageRoles() && (
                  <button
                    onClick={() => setShowRoleManagement(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Roles
                  </button>
                )}
                <button
                  onClick={() => handleExport("users")}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No members found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            {user.username}
                          </p>
                          {user.full_name && (
                            <p className="text-sm text-gray-600">
                              {user.full_name}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            {getRoleDisplayName(user.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(
                            user.level,
                          )}`}
                        >
                          {user.level}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {user.points}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "contributions" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Contributions</h2>
              <div className="flex space-x-2">
                {canCreateContribution() && (
                  <button
                    onClick={() => setShowContributionForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Contribution
                  </button>
                )}
                <button
                  onClick={() => handleExport("contributions")}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {contributions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No contributions recorded</p>
                </div>
              ) : (
                contributions.map((contribution) => {
                  const member = users.find(
                    (u) => u.id === contribution.member_id,
                  );
                  return (
                    <div
                      key={contribution.id}
                      className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {member?.username || "Unknown Member"}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {contribution.description}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          +{contribution.points} points
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="capitalize">
                            {contribution.contribution_type?.replace("_", " ")}
                          </span>
                          <span>{contribution.date}</span>
                          {contribution.activity && (
                            <span>Activity: {contribution.activity.title}</span>
                          )}
                        </div>
                        <span>
                          Recorded by:{" "}
                          {contribution.recorded_by?.username || "Unknown"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard users={users} contributions={contributions} />
        )}

        {activeTab === "analytics" &&
          (profile?.role === "admin" || profile?.role === "president") && (
            <AnalyticsDashboard analytics={analytics} />
          )}
      </main>

      {/* Modals and Forms */}
      <ActivityForm
        isOpen={showActivityForm}
        onClose={() => {
          setShowActivityForm(false);
          setSelectedActivity(null);
        }}
        onSubmit={(data) => {
          if (selectedActivity) {
            return updateActivity(selectedActivity.id, data);
          } else {
            return createActivity(data, session.user.id);
          }
        }}
        initialData={selectedActivity}
      />

      <ContributionForm
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        onSubmit={(data) => createContribution(data, session.user.id)}
        currentUser={profile} // Use actual profile, not fallback
        users={users}
        activities={activities}
      />

      <RoleManagement
        isOpen={showRoleManagement}
        onClose={() => setShowRoleManagement(false)}
        session={session} // Pass session instead of currentUser
        users={users}
        onUpdateRole={updateUserRole}
      />

      <ActivityRegistration
        isOpen={showActivityRegistration}
        onClose={() => {
          setShowActivityRegistration(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        currentUser={profile} // Use actual profile
        onRegister={registerForActivity}
        onUnregister={unregisterFromActivity}
      />
    </div>
  );
};

export default Dashboard;
