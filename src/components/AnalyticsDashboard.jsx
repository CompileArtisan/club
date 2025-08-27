import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Award,
  Calendar,
  Download,
  Filter,
  PieChart,
  Target,
} from "lucide-react";

const AnalyticsDashboard = ({ analytics }) => {
  const [timeFilter, setTimeFilter] = useState("all"); // all, month, quarter, year
  const [selectedMetric, setSelectedMetric] = useState("engagement");

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Analytics data not available</p>
      </div>
    );
  }

  const {
    overview,
    distributions,
    leaderboard,
    recent,
    userEngagement,
    contributionTrends,
    rolePerformance,
  } = analytics;

  const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div
          className={`p-3 rounded-full ${color.replace("text-", "bg-").replace("-600", "-100")}`}
        >
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{trend}</span>
        </div>
      )}
    </div>
  );

  const ProgressBar = ({ label, value, max, color = "blue" }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label}</span>
          <span>
            {value}/{max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const RolePerformanceChart = ({ data }) => {
    const maxPoints = Math.max(...data.map((d) => d.totalPoints));

    return (
      <div className="space-y-4">
        {data.map((role, index) => (
          <div key={role.role} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900 capitalize">
                {role.role.replace("_", " ")}
              </h4>
              <span className="text-sm text-gray-600">
                {role.userCount} users
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Avg Points:</span>
                <span className="font-semibold ml-2">{role.averagePoints}</span>
              </div>
              <div>
                <span className="text-gray-500">Avg Contributions:</span>
                <span className="font-semibold ml-2">
                  {role.averageContributions}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total Points:</span>
                <span className="font-semibold ml-2">{role.totalPoints}</span>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar
                label="Role Contribution"
                value={role.totalPoints}
                max={maxPoints}
                color="purple"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const TopEngagementUsers = ({ users }) => (
    <div className="space-y-3">
      {users.slice(0, 10).map((user, index) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-semibold">
              #{index + 1}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-600">
                {user.recentContributions} recent • {user.totalContributions}{" "}
                total
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-blue-600">
              {Math.round(user.engagementScore)}
            </p>
            <p className="text-xs text-gray-500">score</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">
            Comprehensive club performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="quarter">This Quarter</option>
            <option value="month">This Month</option>
          </select>
          <button className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Members"
          value={overview.totalUsers}
          icon={Users}
          color="text-blue-600"
          trend="+12% this month"
        />
        <MetricCard
          title="Total Activities"
          value={overview.totalActivities}
          icon={Activity}
          color="text-green-600"
          trend="+8% this month"
        />
        <MetricCard
          title="Total Contributions"
          value={overview.totalContributions}
          icon={Award}
          color="text-purple-600"
          trend="+15% this month"
        />
        <MetricCard
          title="Total Points Awarded"
          value={overview.totalPoints.toLocaleString()}
          icon={Target}
          color="text-orange-600"
          subtitle={`Avg: ${overview.averagePoints} per member`}
        />
      </div>

      {/* Recent Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Contributions</span>
              <span className="font-semibold text-green-600">
                +{recent.contributions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Activities</span>
              <span className="font-semibold text-blue-600">
                +{recent.activities}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Members</span>
              <span className="font-semibold text-purple-600">
                +{recent.newUsers}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contribution Trends
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Monthly</span>
              <span className="font-semibold text-blue-600">
                {contributionTrends.monthly}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Quarterly</span>
              <span className="font-semibold text-green-600">
                {contributionTrends.quarterly}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Points/Contribution</span>
              <span className="font-semibold text-purple-600">
                {contributionTrends.averagePointsPerContribution}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Level Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(distributions.levelDistribution).map(
              ([level, count]) => (
                <ProgressBar
                  key={level}
                  label={level}
                  value={count}
                  max={overview.totalUsers}
                  color={
                    level === "Platinum"
                      ? "purple"
                      : level === "Gold"
                        ? "yellow"
                        : level === "Silver"
                          ? "gray"
                          : "amber"
                  }
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Role Performance
            </h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <RolePerformanceChart data={rolePerformance} />
        </div>

        {/* Top Engaged Users */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Most Engaged Members
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <TopEngagementUsers users={userEngagement} />
        </div>
      </div>

      {/* Contribution Type Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Contribution Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(distributions.contributionsByType).map(
            ([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{count}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {type.replace("_", " ")}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Strengths</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>
                • High engagement from{" "}
                {userEngagement[0]?.username || "top members"}
              </li>
              <li>• Strong contribution growth this month</li>
              <li>• Good distribution across activity types</li>
              <li>• Active leadership participation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">
              Areas for Improvement
            </h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>
                • Encourage more{" "}
                {Object.keys(distributions.levelDistribution)[0] || "Bronze"}{" "}
                level participation
              </li>
              <li>• Increase activity frequency</li>
              <li>• Diversify contribution types</li>
              <li>• Improve member retention strategies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
