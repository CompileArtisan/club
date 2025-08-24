import React, { useEffect } from "react";
import {
  User,
  Plus,
  Award,
  Activity,
  Users,
  LogOut,
  Bell,
  Trophy,
} from "lucide-react";
import useStore from "../store/useStore";
import ActivityForm from "./ActivityForm";
import ContributionForm from "./ContributionForm";
import Leaderboard from "./Leaderboard";

const Dashboard = () => {
  const {
    profile,
    users,
    activities,
    contributions,
    notifications,
    activeTab,
    showActivityForm,
    showContributionForm,
    setActiveTab,
    setShowActivityForm,
    setShowContributionForm,
    signOut,
    initializeApp,
    canCreateActivity,
    canCreateContribution,
    createActivity,
    createContribution,
  } = useStore();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

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

  const handleCreateActivity = async (activityData) => {
    await createActivity(activityData);
  };

  const handleCreateContribution = async (contributionData) => {
    await createContribution(contributionData);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Your Points
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profile.points}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Your Level
                      </dt>
                      <dd
                        className={`text-lg font-medium px-2 py-1 rounded ${getLevelColor(profile.level)}`}
                      >
                        {profile.level}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Activities
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activities.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Trophy className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Your Rank
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        #
                        {users
                          .sort((a, b) => b.points - a.points)
                          .findIndex((u) => u.id === profile.id) + 1}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="col-span-full bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Activities
                </h3>
              </div>
              <div className="p-6">
                {activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-500">{activity.date}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {activity.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === "activities" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Activities</h2>
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
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {activity.title}
                        </h3>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>📅 {activity.date}</span>
                        <span>
                          👤 Created by {activity.created_by?.username}
                        </span>
                        {activity.max_participants && (
                          <span>
                            👥 Max {activity.max_participants} participants
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Members</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getRoleDisplayName(user.role)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-900">
                          {user.points} points
                        </div>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(user.level)}`}
                        >
                          {user.level}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === "contributions" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Contributions
              </h2>
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
              {contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="bg-white p-6 rounded-lg shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {contribution.member?.username}
                        </h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          +{contribution.points} points
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {contribution.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>📅 {contribution.date}</span>
                        <span>
                          👤 Recorded by {contribution.recorded_by?.username}
                        </span>
                        {contribution.activity && (
                          <span>
                            🎯 Related to: {contribution.activity.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <Leaderboard users={users} contributions={contributions} />
        )}
      </main>

      {/* Forms */}
      <ActivityForm
        isOpen={showActivityForm}
        onClose={() => setShowActivityForm(false)}
        onSubmit={handleCreateActivity}
      />

      <ContributionForm
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        onSubmit={handleCreateContribution}
        currentUser={profile}
        users={users}
        activities={activities}
      />
    </div>
  );
};

export default Dashboard;
