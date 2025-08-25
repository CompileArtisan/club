import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import useStore from "../store/useStore";
import ActivityForm from "./ActivityForm";
import ContributionForm from "./ContributionForm";
import Leaderboard from "./Leaderboard";

const Dashboard = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const {
    profile,
    users,
    activities,
    contributions,
    activeTab,
    showActivityForm,
    showContributionForm,
    setActiveTab,
    setShowActivityForm,
    setShowContributionForm,
    canCreateActivity,
    canCreateContribution,
    createActivity,
    createContribution,
    fetchProfile,
    fetchUsers,
    fetchActivities,
    fetchContributions,
    createProfile,
  } = useStore();

  // Load data when Dashboard mounts
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) {
        console.error("No user session found");
        setError("No user session found");
        setLoading(false);
        return;
      }

      console.log("Loading dashboard data for user:", session.user.id);
      setLoading(true);
      setError(null);

      try {
        // Try to fetch profile first
        console.log("Fetching profile...");
        const profileResult = await fetchProfile(session.user.id);

        if (!profileResult) {
          // Profile doesn't exist, try to create one
          console.log("Profile not found, attempting to create...");
          try {
            const userData = {
              username:
                session.user.user_metadata?.username ||
                session.user.email?.split("@")[0] ||
                "user",
              fullName: session.user.user_metadata?.full_name || "",
            };

            await createProfile(session.user.id, userData);
            console.log("Profile created successfully");
          } catch (createError) {
            console.error("Failed to create profile:", createError);
            setShowProfileSetup(true);
          }
        }

        // Fetch other data in parallel
        console.log("Fetching other data...");
        const [usersResult, activitiesResult, contributionsResult] =
          await Promise.allSettled([
            fetchUsers(),
            fetchActivities(),
            fetchContributions(),
          ]);

        // Log results for debugging
        if (usersResult.status === "rejected") {
          console.error("Failed to fetch users:", usersResult.reason);
        }
        if (activitiesResult.status === "rejected") {
          console.error("Failed to fetch activities:", activitiesResult.reason);
        }
        if (contributionsResult.status === "rejected") {
          console.error(
            "Failed to fetch contributions:",
            contributionsResult.reason,
          );
        }

        console.log("Dashboard data loading completed");
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError(`Failed to load dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.user?.id]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfileSetup = async (setupData) => {
    try {
      await createProfile(session.user.id, setupData);
      setShowProfileSetup(false);
    } catch (error) {
      console.error("Error setting up profile:", error);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
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
      Bronze: "text-amber-600 bg-amber-50",
      Silver: "text-gray-600 bg-gray-50",
      Gold: "text-yellow-600 bg-yellow-50",
      Platinum: "text-purple-600 bg-purple-50",
    };
    return colors[level] || "text-gray-600 bg-gray-50";
  };

  // Profile Setup Component
  const ProfileSetup = () => {
    const [setupData, setSetupData] = useState({
      username: session.user.email?.split("@")[0] || "",
      fullName: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await handleProfileSetup(setupData);
      } finally {
        setIsSubmitting(false);
      }
    };

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={setupData.username}
                onChange={(e) =>
                  setSetupData({ ...setupData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={setupData.fullName}
                onChange={(e) =>
                  setSetupData({ ...setupData, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !setupData.username}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {isSubmitting ? "Setting up..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Show profile setup if needed
  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  // Show error state
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

  // Show loading state only if still loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Setting up dashboard...</div>
          <div className="text-sm text-gray-500">Loading your data...</div>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard even if profile is null (fallback)
  const displayProfile = profile || {
    username: session.user.email?.split("@")[0] || "User",
    role: "member",
    points: 0,
    level: "Bronze",
  };

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
              <span className="text-sm text-gray-600">
                Welcome, {displayProfile.username} (
                {getRoleDisplayName(displayProfile.role)})
              </span>
              <button
                onClick={signOut}
                className="flex items-center text-sm text-red-600 hover:text-red-800"
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
              "dashboard",
              "activities",
              "members",
              "contributions",
              "leaderboard",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "leaderboard" ? (
                  <span className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    Leaderboard
                  </span>
                ) : (
                  tab.charAt(0).toUpperCase() + tab.slice(1)
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium">Your Points</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {displayProfile.points}
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
                    className={`px-3 py-1 rounded-full ${getLevelColor(displayProfile.level)}`}
                  >
                    {displayProfile.level}
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
        )}

        {activeTab === "activities" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Activities</h2>
              {canCreateActivity() && (
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Activity
                </button>
              )}
            </div>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No activities found</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white p-6 rounded-lg shadow"
                  >
                    <h3 className="text-lg font-medium">{activity.title}</h3>
                    <p className="text-gray-600">{activity.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {activity.date}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Members</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No members found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getRoleDisplayName(user.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm font-medium ${getLevelColor(user.level)}`}
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
              {canCreateContribution() && (
                <button
                  onClick={() => setShowContributionForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Contribution
                </button>
              )}
            </div>
            <div className="space-y-4">
              {contributions.length === 0 ? (
                <div className="text-center py-8">
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
                      className="bg-white p-6 rounded-lg shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {member?.username || "Unknown Member"}
                          </h3>
                          <p className="text-gray-600">
                            {contribution.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            +{contribution.points} points
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {contribution.contribution_type?.replace("_", " ")}
                        </span>
                        <span>{contribution.date}</span>
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
      </main>

      {/* Forms */}
      <ActivityForm
        isOpen={showActivityForm}
        onClose={() => setShowActivityForm(false)}
        onSubmit={(data) => createActivity(data, session.user.id)}
      />

      <ContributionForm
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        onSubmit={(data) => createContribution(data, session.user.id)}
        currentUser={displayProfile}
        users={users}
        activities={activities}
      />
    </div>
  );
};

export default Dashboard;
