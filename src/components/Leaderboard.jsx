import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  User,
  TrendingUp,
  Crown,
  Star,
} from "lucide-react";

const Leaderboard = ({ users, contributions }) => {
  const [timeFilter, setTimeFilter] = useState("all"); // all, month, week

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
      Bronze: "text-amber-700 bg-amber-100 border-amber-300",
      Silver: "text-gray-700 bg-gray-100 border-gray-300",
      Gold: "text-yellow-700 bg-yellow-100 border-yellow-300",
      Platinum: "text-purple-700 bg-purple-100 border-purple-300",
    };
    return colors[level] || "text-gray-700 bg-gray-100 border-gray-300";
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-500" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">
            #{position}
          </span>
        );
    }
  };

  const getRankBackground = (position) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  // Calculate contributions count for each user
  const getUserContributionCount = (userId) => {
    return contributions.filter(
      (contribution) => contribution.member_id === userId,
    ).length;
  };

  // Filter users and sort by points
  const sortedUsers = [...users]
    .sort((a, b) => b.points - a.points)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      contributionCount: getUserContributionCount(user.id),
    }));

  // Get top 3 for podium display
  const topThree = sortedUsers.slice(0, 3);
  const restOfUsers = sortedUsers.slice(3);

  // Calculate some stats
  const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
  const averagePoints = Math.round(totalPoints / users.length);
  const highestPoints = sortedUsers[0]?.points || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Club Leaderboard
        </h1>
        <p className="text-gray-600">
          Track your progress and see where you stand!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-blue-600 font-semibold">Total Members</p>
              <p className="text-2xl font-bold text-blue-800">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-green-600 font-semibold">Average Points</p>
              <p className="text-2xl font-bold text-green-800">
                {averagePoints}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-yellow-600 font-semibold">Highest Score</p>
              <p className="text-2xl font-bold text-yellow-800">
                {highestPoints}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            🏆 Top Performers
          </h2>
          <div className="flex justify-center items-end space-x-4">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="text-center">
                <div className="bg-gradient-to-t from-gray-200 to-gray-300 rounded-lg p-4 h-24 flex items-end justify-center mb-2 border-2 border-gray-400">
                  <Medal className="w-8 h-8 text-gray-600" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-300">
                  <div className="flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="font-bold text-gray-800">
                    {topThree[1].username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getRoleDisplayName(topThree[1].role)}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLevelColor(topThree[1].level)}`}
                    >
                      {topThree[1].level}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mt-2">
                    {topThree[1].points} pts
                  </p>
                  <p className="text-xs text-gray-500">
                    {topThree[1].contributionCount} contributions
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="text-center">
                <div className="bg-gradient-to-t from-yellow-300 to-yellow-400 rounded-lg p-4 h-32 flex items-end justify-center mb-2 border-2 border-yellow-500">
                  <Crown className="w-10 h-10 text-yellow-700" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-yellow-400">
                  <div className="flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="font-bold text-gray-800">
                    {topThree[0].username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getRoleDisplayName(topThree[0].role)}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLevelColor(topThree[0].level)}`}
                    >
                      {topThree[0].level}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-yellow-600 mt-2">
                    {topThree[0].points} pts
                  </p>
                  <p className="text-xs text-gray-500">
                    {topThree[0].contributionCount} contributions
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="text-center">
                <div className="bg-gradient-to-t from-amber-200 to-amber-300 rounded-lg p-4 h-20 flex items-end justify-center mb-2 border-2 border-amber-400">
                  <Award className="w-7 h-7 text-amber-700" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-amber-300">
                  <div className="flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="font-bold text-gray-800">
                    {topThree[2].username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getRoleDisplayName(topThree[2].role)}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLevelColor(topThree[2].level)}`}
                    >
                      {topThree[2].level}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-amber-600 mt-2">
                    {topThree[2].points} pts
                  </p>
                  <p className="text-xs text-gray-500">
                    {topThree[2].contributionCount} contributions
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Full Rankings</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedUsers.map((user, index) => (
            <div
              key={user.id}
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition duration-150 border-l-4 ${getRankBackground(user.rank)}`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">{getRankIcon(user.rank)}</div>

                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-semibold text-gray-900 truncate">
                      {user.username}
                    </p>
                    {user.rank <= 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Top {user.rank}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {getRoleDisplayName(user.role)} • {user.contributionCount}{" "}
                    contributions
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getLevelColor(user.level)}`}
                    >
                      {user.level}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {user.points}
                  </p>
                  <p className="text-sm text-gray-500">points</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Insights */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📊 Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-800">
              <span className="font-semibold">Most Active:</span>{" "}
              {sortedUsers[0]?.username || "N/A"} with{" "}
              {sortedUsers[0]?.contributionCount || 0} contributions
            </p>
          </div>
          <div>
            <p className="text-blue-800">
              <span className="font-semibold">Total Contributions:</span>{" "}
              {contributions.length} recorded
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
