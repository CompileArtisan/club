import React, { useEffect, useState } from "react";
import {
  User,
  Plus,
  Award,
  Activity,
  Users,
  LogOut,
  Trophy,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import useStore from "../store/useStore";
import ActivityForm from "./ActivityForm";
import ContributionForm from "./ContributionForm";
import Leaderboard from "./Leaderboard";

const Dashboard = ({ session }) => {
  const [loading, setLoading] = useState(true);

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
  } = useStore();

  // Load data when Dashboard mounts
  useEffect(() => {
    const loadData = async () => {
      console.log("📊 Loading dashboard data...");
      setLoading(true);

      try {
        // Fetch profile first
        await fetchProfile(session.user.id);

        // Then fetch other data
        await Promise.all([
          fetchUsers(),
          fetchActivities(),
          fetchContributions(),
        ]);

        console.log("✅ Dashboard data loaded");
      } catch (error) {
        console.error("❌ Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadData();
    }
  }, [
    session?.user?.id,
    fetchProfile,
    fetchUsers,
    fetchActivities,
    fetchContributions,
  ]);

  const signOut = async () => {
    await supabase.auth.signOut();
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Setting up dashboard...</div>
          <div className="text-sm text-gray-500">Loading your data...</div>
        </div>
      </div>
    );
  }

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
                Welcome, {profile.username} ({getRoleDisplayName(profile.role)})
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
        {/* Dashboard content remains the same as your original code */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Your dashboard cards here - copy from original */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium">Your Points</h3>
              <p className="text-3xl font-bold text-blue-600">
                {profile.points}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium">Your Level</h3>
              <span
                className={`px-3 py-1 rounded-full ${getLevelColor(profile.level)}`}
              >
                {profile.level}
              </span>
            </div>
            {/* Add other dashboard content */}
          </div>
        )}

        {/* Other tabs - copy from your original Dashboard component */}
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
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white p-6 rounded-lg shadow"
                >
                  <h3 className="text-lg font-medium">{activity.title}</h3>
                  <p className="text-gray-600">{activity.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    📅 {activity.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add other tabs similarly */}
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
        currentUser={profile}
        users={users}
        activities={activities}
      />
    </div>
  );
};

export default Dashboard;
