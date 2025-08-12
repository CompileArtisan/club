import React, { useState, useEffect } from "react";
import { User, Plus, Award, Activity, Users, LogOut, Menu } from "lucide-react";

const CodeChefASEBApp = () => {
  // Mock data - in real app, this would come from backend
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([
    {
      id: 1,
      username: "president_user",
      role: "president",
      points: 150,
      level: "Gold",
    },
    {
      id: 2,
      username: "vp_user",
      role: "vice_president",
      points: 120,
      level: "Gold",
    },
    {
      id: 3,
      username: "treasurer_user",
      role: "treasurer",
      points: 100,
      level: "Silver",
    },
    {
      id: 4,
      username: "senior_exec1",
      role: "senior_executive",
      points: 80,
      level: "Silver",
    },
    { id: 5, username: "member1", role: "member", points: 45, level: "Bronze" },
    { id: 6, username: "member2", role: "member", points: 30, level: "Bronze" },
  ]);

  const [activities, setActivities] = useState([
    {
      id: 1,
      title: "Weekly Coding Contest",
      description: "Practice session for competitive programming",
      createdBy: 1,
      date: "2024-08-15",
    },
    {
      id: 2,
      title: "Algorithm Workshop",
      description: "Learn advanced algorithms and data structures",
      createdBy: 2,
      date: "2024-08-20",
    },
  ]);

  const [contributions, setContributions] = useState([
    {
      id: 1,
      memberId: 5,
      description: "Solved 5 problems in contest",
      points: 25,
      recordedBy: 4,
      date: "2024-08-12",
    },
    {
      id: 2,
      memberId: 6,
      description: "Helped organize workshop",
      points: 20,
      recordedBy: 4,
      date: "2024-08-10",
    },
  ]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLogin, setShowLogin] = useState(true);

  // Login form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Activity form states
  const [activityForm, setActivityForm] = useState({
    title: "",
    description: "",
    date: "",
  });
  const [showActivityForm, setShowActivityForm] = useState(false);

  // Contribution form states
  const [contributionForm, setContributionForm] = useState({
    memberId: "",
    description: "",
    points: "",
  });
  const [showContributionForm, setShowContributionForm] = useState(false);

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

  const canCreateActivity = (role) => {
    return ["president", "vice_president", "treasurer"].includes(role);
  };

  const canCreateContribution = (role) => {
    return [
      "senior_executive",
      "president",
      "vice_president",
      "treasurer",
    ].includes(role);
  };

  const getLevelColor = (level) => {
    const colors = {
      Bronze: "text-amber-600 bg-amber-50",
      Silver: "text-gray-600 bg-gray-50",
      Gold: "text-yellow-600 bg-yellow-50",
    };
    return colors[level] || "text-gray-600 bg-gray-50";
  };

  const calculateLevel = (points) => {
    if (points >= 100) return "Gold";
    if (points >= 50) return "Silver";
    return "Bronze";
  };

  const handleLogin = () => {
    // Mock login - in real app, validate with backend
    const user = users.find((u) => u.username === loginForm.username);
    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
      setLoginForm({ username: "", password: "" });
    } else {
      alert("User not found");
    }
  };

  const handleRegister = () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Mock registration
    const newUser = {
      id: users.length + 1,
      username: registerForm.username,
      role: "member",
      points: 0,
      level: "Bronze",
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setShowLogin(false);
    setRegisterForm({ username: "", password: "", confirmPassword: "" });
    setIsRegistering(false);
  };

  const handleCreateActivity = () => {
    const newActivity = {
      id: activities.length + 1,
      ...activityForm,
      createdBy: currentUser.id,
    };
    setActivities([...activities, newActivity]);
    setActivityForm({ title: "", description: "", date: "" });
    setShowActivityForm(false);
  };

  const handleCreateContribution = () => {
    const newContribution = {
      id: contributions.length + 1,
      memberId: parseInt(contributionForm.memberId),
      description: contributionForm.description,
      points: parseInt(contributionForm.points),
      recordedBy: currentUser.id,
      date: new Date().toISOString().split("T")[0],
    };

    setContributions([...contributions, newContribution]);

    // Update user points
    setUsers(
      users.map((user) => {
        if (user.id === newContribution.memberId) {
          const newPoints = user.points + newContribution.points;
          return {
            ...user,
            points: newPoints,
            level: calculateLevel(newPoints),
          };
        }
        return user;
      }),
    );

    setContributionForm({ memberId: "", description: "", points: "" });
    setShowContributionForm(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setActiveTab("dashboard");
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">CodeChef ASEB</h1>
            <p className="text-gray-600">Club Management System</p>
          </div>

          {!isRegistering ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Login
              </button>
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-blue-600 hover:underline"
                >
                  Register here
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
              >
                Register
              </button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-blue-600 hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          )}
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
                Welcome, {currentUser.username} (
                {getRoleDisplayName(currentUser.role)})
              </span>
              <button
                onClick={logout}
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
            {["dashboard", "activities", "members", "contributions"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        {currentUser.points}
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
                        className={`text-lg font-medium px-2 py-1 rounded ${getLevelColor(currentUser.level)}`}
                      >
                        {currentUser.level}
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
          </div>
        )}

        {/* Activities */}
        {activeTab === "activities" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Activities</h2>
              {canCreateActivity(currentUser.role) && (
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Activity
                </button>
              )}
            </div>

            {showActivityForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Create New Activity
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={activityForm.title}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={activityForm.description}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={activityForm.date}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleCreateActivity}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Create Activity
                    </button>
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {activities.map((activity) => {
                const creator = users.find((u) => u.id === activity.createdBy);
                return (
                  <div
                    key={activity.id}
                    className="bg-white p-6 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {activity.title}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Created by {creator?.username} on {activity.date}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Members */}
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

        {/* Contributions */}
        {activeTab === "contributions" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Contributions
              </h2>
              {canCreateContribution(currentUser.role) && (
                <button
                  onClick={() => setShowContributionForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Contribution
                </button>
              )}
            </div>

            {showContributionForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Record New Contribution
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member
                    </label>
                    <select
                      value={contributionForm.memberId}
                      onChange={(e) =>
                        setContributionForm({
                          ...contributionForm,
                          memberId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a member</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({getRoleDisplayName(user.role)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={contributionForm.description}
                      onChange={(e) =>
                        setContributionForm({
                          ...contributionForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      value={contributionForm.points}
                      onChange={(e) =>
                        setContributionForm({
                          ...contributionForm,
                          points: e.target.value,
                        })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleCreateContribution}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Record Contribution
                    </button>
                    <button
                      onClick={() => setShowContributionForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {contributions.map((contribution) => {
                const member = users.find(
                  (u) => u.id === contribution.memberId,
                );
                const recorder = users.find(
                  (u) => u.id === contribution.recordedBy,
                );
                return (
                  <div
                    key={contribution.id}
                    className="bg-white p-6 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {member?.username} - {contribution.points} points
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {contribution.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Recorded by {recorder?.username} on{" "}
                          {contribution.date}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        +{contribution.points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CodeChefASEBApp;
