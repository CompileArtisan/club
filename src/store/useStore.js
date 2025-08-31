import { create } from "zustand";
import { supabase, handleSupabaseError } from "../lib/supabase";
import toast from "react-hot-toast";

const useStore = create((set, get) => ({
  // Data State
  profile: null,
  users: [],
  activities: [],
  contributions: [],

  // UI State
  activeTab: "dashboard",
  showActivityForm: false,
  showContributionForm: false,
  showRoleManagement: false,
  showDeleteConfirm: false,
  userToDelete: null,

  // Actions
  setProfile: (profile) => set({ profile }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowActivityForm: (show) => set({ showActivityForm: show }),
  setShowContributionForm: (show) => set({ showContributionForm: show }),
  setShowRoleManagement: (show) => set({ showRoleManagement: show }),
  setShowDeleteConfirm: (show, user = null) =>
    set({ showDeleteConfirm: show, userToDelete: user }),

  // Permission functions with admin support
  canCreateActivity: () => {
    const { profile } = get();
    if (!profile) {
      console.warn("canCreateActivity: No profile loaded");
      return false;
    }
    return [
      "admin",
      "president",
      "vice_president",
      "treasurer",
      "senior_executive",
    ].includes(profile.role);
  },

  canCreateContribution: () => {
    const { profile } = get();
    if (!profile) {
      console.warn("canCreateContribution: No profile loaded");
      return false;
    }
    return [
      "admin",
      "president",
      "vice_president",
      "treasurer",
      "senior_executive",
    ].includes(profile.role);
  },

  canManageRoles: () => {
    const { profile } = get();
    if (!profile) {
      console.warn("canManageRoles: No profile loaded");
      return false;
    }
    return ["admin", "president", "vice_president", "treasurer"].includes(
      profile.role,
    );
  },

  canDeleteUsers: () => {
    const { profile } = get();
    return profile && profile.role === "admin";
  },

  canEditActivity: (activity) => {
    const { profile } = get();
    if (!profile) return false;

    // Admin can edit all activities
    if (profile.role === "admin") return true;

    // Creator can edit their own activities
    if (activity.created_by === profile.id) return true;

    // Higher roles can edit activities created by lower roles
    const roleHierarchy = {
      president: 5,
      vice_president: 4,
      treasurer: 3,
      senior_executive: 2,
      member: 1,
    };

    const currentUserLevel = roleHierarchy[profile.role] || 0;
    return currentUserLevel >= 3; // Treasurer and above can edit activities
  },

  canDeleteActivity: (activity) => {
    const { profile } = get();
    if (!profile) return false;

    // Admin can delete all activities
    if (profile.role === "admin") return true;

    // Creator can delete their own activities
    if (activity.created_by === profile.id) return true;

    // Only president and above can delete others' activities
    return ["president"].includes(profile.role);
  },

  canEditContribution: (contribution) => {
    const { profile } = get();
    if (!profile) return false;

    // Admin can edit all contributions
    if (profile.role === "admin") return true;

    // Recorder can edit their own contributions (within 24 hours)
    if (contribution.recorded_by === profile.id) {
      const contributionDate = new Date(contribution.created_at);
      const now = new Date();
      const hoursDiff = (now - contributionDate) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }

    return false;
  },

  canDeleteContribution: (contribution) => {
    const { profile } = get();
    if (!profile) return false;

    // Admin can delete all contributions
    if (profile.role === "admin") return true;

    // President can delete contributions
    if (profile.role === "president") return true;

    // Recorder can delete their own contributions (within 1 hour)
    if (contribution.recorded_by === profile.id) {
      const contributionDate = new Date(contribution.created_at);
      const now = new Date();
      const hoursDiff = (now - contributionDate) / (1000 * 60 * 60);
      return hoursDiff <= 1;
    }

    return false;
  },

  // Profile Actions
  fetchProfile: async (userId) => {
    try {
      console.log("Fetching profile for:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("Profile not found - user might be new");
          set({ profile: null });
          return null;
        }
        throw error;
      }

      console.log("Profile fetched successfully:", data);

      // Make sure we set the profile in the store
      set({ profile: data });

      // Also update the users array if this profile is in there
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, ...data } : user,
        ),
      }));

      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      set({ profile: null });
      return null;
    }
  },

  createProfile: async (userId, userData) => {
    try {
      console.log("Creating profile for:", userId, userData);

      const profileData = {
        id: userId,
        username: userData.username || "user",
        full_name: userData.fullName || "",
        role: "member", // Default role
        points: 0,
        level: "Bronze",
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([profileData])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          if (error.message.includes("username")) {
            throw new Error(
              "Username already exists. Please choose a different one.",
            );
          }
          throw new Error("This profile already exists.");
        }
        throw error;
      }

      console.log("Profile created successfully:", data);

      // Set the profile in the store immediately
      set({ profile: data });

      // Also add to users array
      set((state) => ({
        users: [data, ...state.users],
      }));

      toast.success("Profile created successfully!");
      return data;
    } catch (error) {
      console.error("Error creating profile:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      throw error;
    }
  },

  updateProfile: async (userId, profileData) => {
    try {
      console.log("Updating profile:", userId, profileData);

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      // Update in state if it's the current user's profile
      const { profile } = get();
      if (profile && profile.id === userId) {
        set({ profile: data });
      }

      // Update in users list
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, ...data } : user,
        ),
      }));

      toast.success("Profile updated successfully!");
      console.log("Profile updated:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  // Data fetching with better error handling
  fetchUsers: async () => {
    try {
      console.log("Fetching users...");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;

      console.log("Users fetched:", data?.length || 0);
      set({ users: data || [] });
      return data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ users: [] });
      return [];
    }
  },

  fetchActivities: async () => {
    try {
      console.log("Fetching activities...");
      const { data, error } = await supabase
        .from("activities")
        .select(
          `
          *,
          created_by:profiles!activities_created_by_fkey(username, full_name)
        `,
        )
        .order("date", { ascending: false });

      if (error) throw error;

      console.log("Activities fetched:", data?.length || 0);
      set({ activities: data || [] });
      return data || [];
    } catch (error) {
      console.error("Error fetching activities:", error);
      set({ activities: [] });
      return [];
    }
  },

  fetchContributions: async () => {
    try {
      console.log("Fetching contributions...");
      const { data, error } = await supabase
        .from("contributions")
        .select(
          `
          *,
          member:profiles!contributions_member_id_fkey(id, username, full_name),
          recorded_by:profiles!contributions_recorded_by_fkey(username, full_name),
          activity:activities(title)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Contributions fetched:", data?.length || 0);
      set({ contributions: data || [] });
      return data || [];
    } catch (error) {
      console.error("Error fetching contributions:", error);
      set({ contributions: [] });
      return [];
    }
  },

  createActivity: async (activityData, userId) => {
    try {
      console.log("Creating activity:", activityData);

      const { data, error } = await supabase
        .from("activities")
        .insert([
          {
            ...activityData,
            created_by: userId,
          },
        ])
        .select(
          `
          *,
          created_by:profiles!activities_created_by_fkey(username, full_name)
        `,
        )
        .single();

      if (error) throw error;

      set((state) => ({
        activities: [data, ...state.activities],
        showActivityForm: false,
      }));

      toast.success("Activity created successfully!");
      console.log("Activity created:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error creating activity:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  updateActivity: async (activityId, activityData) => {
    try {
      console.log("Updating activity:", activityId, activityData);

      const { data, error } = await supabase
        .from("activities")
        .update({
          ...activityData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activityId)
        .select(
          `
          *,
          created_by:profiles!activities_created_by_fkey(username, full_name)
        `,
        )
        .single();

      if (error) throw error;

      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === activityId ? data : activity,
        ),
      }));

      toast.success("Activity updated successfully!");
      console.log("Activity updated:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating activity:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  deleteActivity: async (activityId) => {
    try {
      console.log("Deleting activity:", activityId);

      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      set((state) => ({
        activities: state.activities.filter(
          (activity) => activity.id !== activityId,
        ),
      }));

      toast.success("Activity deleted successfully!");
      console.log("Activity deleted:", activityId);
      return { error: null };
    } catch (error) {
      console.error("Error deleting activity:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  createContribution: async (contributionData, userId) => {
    try {
      console.log("Creating contribution:", contributionData);
      const { users } = get();

      const targetUser = users.find((u) => u.id === contributionData.member_id);
      if (!targetUser) throw new Error("Target user not found");

      // Verify permission hierarchy
      const currentUser = get().profile;
      if (!currentUser) throw new Error("You must be logged in");

      const canCreate = get().canCreateContribution();
      if (!canCreate) {
        throw new Error("You don't have permission to record contributions");
      }

      // Create contribution record
      const { data: contribution, error: contributionError } = await supabase
        .from("contributions")
        .insert([
          {
            ...contributionData,
            recorded_by: userId,
            created_at: new Date().toISOString(),
          },
        ])
        .select(
          `
          *,
          member:profiles!contributions_member_id_fkey(id, username, full_name),
          recorded_by:profiles!contributions_recorded_by_fkey(username, full_name),
          activity:activities(title)
        `,
        )
        .single();

      if (contributionError) throw contributionError;

      // Update user points using the database function
      const { error: updateError } = await supabase.rpc(
        "increment_user_points",
        {
          user_id: contributionData.member_id,
          points_to_add: contributionData.points,
        },
      );

      if (updateError) {
        console.error("Error updating points:", updateError);
        // Continue anyway since the contribution was recorded
        toast.warning(
          "Contribution recorded but points update failed. Please refresh.",
        );
      }

      // Refresh users to get updated points and levels
      await get().fetchUsers();

      set((state) => ({
        contributions: [contribution, ...state.contributions],
        showContributionForm: false,
      }));

      toast.success(
        `Contribution recorded! +${contributionData.points} points for ${targetUser.username}`,
      );
      console.log("Contribution created:", contribution);
      return { data: contribution, error: null };
    } catch (error) {
      console.error("Error creating contribution:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  updateContribution: async (contributionId, contributionData) => {
    try {
      console.log("Updating contribution:", contributionId, contributionData);

      // Get the original contribution to calculate point difference
      const originalContribution = get().contributions.find(
        (c) => c.id === contributionId,
      );
      if (!originalContribution)
        throw new Error("Original contribution not found");

      const pointsDifference =
        contributionData.points - originalContribution.points;

      const { data, error } = await supabase
        .from("contributions")
        .update({
          ...contributionData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contributionId)
        .select(
          `
          *,
          member:profiles!contributions_member_id_fkey(id, username, full_name),
          recorded_by:profiles!contributions_recorded_by_fkey(username, full_name),
          activity:activities(title)
        `,
        )
        .single();

      if (error) throw error;

      // Update user points if there's a difference
      if (pointsDifference !== 0) {
        const { error: updateError } = await supabase.rpc(
          "increment_user_points",
          {
            user_id: originalContribution.member_id,
            points_to_add: pointsDifference,
          },
        );

        if (updateError) {
          console.error("Error updating points:", updateError);
          toast.warning(
            "Contribution updated but points update failed. Please refresh.",
          );
        }

        // Refresh users to get updated points and levels
        await get().fetchUsers();
      }

      set((state) => ({
        contributions: state.contributions.map((contribution) =>
          contribution.id === contributionId ? data : contribution,
        ),
      }));

      toast.success("Contribution updated successfully!");
      console.log("Contribution updated:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating contribution:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  deleteContribution: async (contributionId) => {
    try {
      console.log("Deleting contribution:", contributionId);

      // Get the contribution to reverse points
      const contribution = get().contributions.find(
        (c) => c.id === contributionId,
      );
      if (!contribution) throw new Error("Contribution not found");

      const { error } = await supabase
        .from("contributions")
        .delete()
        .eq("id", contributionId);

      if (error) throw error;

      // Reverse the points
      const { error: updateError } = await supabase.rpc(
        "increment_user_points",
        {
          user_id: contribution.member_id,
          points_to_add: -contribution.points,
        },
      );

      if (updateError) {
        console.error("Error reversing points:", updateError);
        toast.warning(
          "Contribution deleted but points reversal failed. Please refresh.",
        );
      }

      // Refresh users to get updated points and levels
      await get().fetchUsers();

      set((state) => ({
        contributions: state.contributions.filter(
          (c) => c.id !== contributionId,
        ),
      }));

      toast.success("Contribution deleted successfully!");
      console.log("Contribution deleted:", contributionId);
      return { error: null };
    } catch (error) {
      console.error("Error deleting contribution:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  // Utility function to refresh all data
  refreshAllData: async () => {
    try {
      console.log("Refreshing all data...");
      await Promise.all([
        get().fetchUsers(),
        get().fetchActivities(),
        get().fetchContributions(),
      ]);
      console.log("All data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  },

  // Clear all data (useful for logout)
  clearData: () => {
    set({
      profile: null,
      users: [],
      activities: [],
      contributions: [],
      activeTab: "dashboard",
      showActivityForm: false,
      showContributionForm: false,
      showRoleManagement: false,
      showDeleteConfirm: false,
      userToDelete: null,
    });
  },

  // Role management with admin support
  // Replace the updateUserRole function in your useStore.js with this corrected version:

  updateUserRole: async (userId, newRole) => {
    try {
      console.log("Updating user role:", userId, "to", newRole);

      const { profile } = get();

      if (!profile) {
        throw new Error("Your profile is not loaded. Please refresh the page.");
      }

      // Use the secure function instead of direct UPDATE
      const { data, error } = await supabase.rpc("update_user_role_secure", {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      console.log("Role update successful:", data);

      // Update the users array in state
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
        showRoleManagement: false,
      }));

      // Refresh users to get updated data
      await get().fetchUsers();

      const updatedUser = get().users.find((u) => u.id === userId);
      toast.success(
        `Successfully updated ${updatedUser?.username || "user"}'s role to ${newRole.replace("_", " ")}`,
      );

      return { data, error: null };
    } catch (error) {
      console.error("Error updating user role:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  // Delete user functionality (admin only)
  deleteUser: async (userId) => {
    try {
      const { profile } = get();

      if (!profile || profile.role !== "admin") {
        throw new Error("Only admins can delete users");
      }

      if (profile.id === userId) {
        throw new Error("You cannot delete your own account");
      }

      console.log("Deleting user:", userId);

      // Use the database function to safely delete user and all related data
      const { error } = await supabase.rpc("delete_user_completely", {
        target_user_id: userId,
      });

      if (error) throw error;

      // Update state to remove the deleted user
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
        showDeleteConfirm: false,
        userToDelete: null,
      }));

      toast.success("User deleted successfully");
      console.log("User deleted:", userId);
      return { error: null };
    } catch (error) {
      console.error("Error deleting user:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  // Bulk operations for admin
  bulkUpdatePoints: async (updates) => {
    try {
      const { profile } = get();

      if (!profile || !["admin", "president"].includes(profile.role)) {
        throw new Error("You don't have permission to perform bulk updates");
      }

      console.log("Performing bulk points update:", updates);

      const promises = updates.map(({ userId, points }) =>
        supabase.rpc("increment_user_points", {
          user_id: userId,
          points_to_add: points,
        }),
      );

      const results = await Promise.allSettled(promises);
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error("Some bulk updates failed:", failed);
        toast.warning(
          `${updates.length - failed.length}/${updates.length} updates succeeded`,
        );
      } else {
        toast.success(
          `Successfully updated points for ${updates.length} users`,
        );
      }

      // Refresh users data
      await get().fetchUsers();

      return { error: null };
    } catch (error) {
      console.error("Error performing bulk update:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  // Statistics and analytics
  getStatistics: () => {
    const { users, activities, contributions } = get();

    const totalUsers = users.length;
    const totalActivities = activities.length;
    const totalContributions = contributions.length;
    const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
    const averagePoints =
      totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

    const levelDistribution = users.reduce((acc, user) => {
      acc[user.level] = (acc[user.level] || 0) + 1;
      return acc;
    }, {});

    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const topContributors = [...users]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const recentActivities = [...activities]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const contributionsByType = contributions.reduce((acc, contrib) => {
      acc[contrib.contribution_type] =
        (acc[contrib.contribution_type] || 0) + 1;
      return acc;
    }, {});

    return {
      overview: {
        totalUsers,
        totalActivities,
        totalContributions,
        totalPoints,
        averagePoints,
      },
      distributions: {
        levelDistribution,
        roleDistribution,
        contributionsByType,
      },
      leaderboard: {
        topContributors,
      },
      recent: {
        recentActivities,
      },
    };
  },

  // Search and filter functions
  searchUsers: (query) => {
    const { users } = get();
    if (!query) return users;

    const lowercaseQuery = query.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(lowercaseQuery) ||
        user.full_name?.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery),
    );
  },

  searchActivities: (query) => {
    const { activities } = get();
    if (!query) return activities;

    const lowercaseQuery = query.toLowerCase();
    return activities.filter(
      (activity) =>
        activity.title.toLowerCase().includes(lowercaseQuery) ||
        activity.description?.toLowerCase().includes(lowercaseQuery) ||
        activity.type.toLowerCase().includes(lowercaseQuery),
    );
  },

  filterContributions: (filters) => {
    const { contributions } = get();
    let filtered = [...contributions];

    if (filters.memberId) {
      filtered = filtered.filter((c) => c.member_id === filters.memberId);
    }

    if (filters.type) {
      filtered = filtered.filter((c) => c.contribution_type === filters.type);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (c) => new Date(c.date) >= new Date(filters.dateFrom),
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (c) => new Date(c.date) <= new Date(filters.dateTo),
      );
    }

    if (filters.minPoints) {
      filtered = filtered.filter((c) => c.points >= filters.minPoints);
    }

    if (filters.maxPoints) {
      filtered = filtered.filter((c) => c.points <= filters.maxPoints);
    }

    return filtered;
  },

  // Export functionality
  exportData: async (type) => {
    try {
      const { profile } = get();

      if (
        !profile ||
        !["admin", "president", "vice_president"].includes(profile.role)
      ) {
        throw new Error("You don't have permission to export data");
      }

      const { users, activities, contributions } = get();
      let data, filename;

      switch (type) {
        case "users":
          data = users.map((user) => ({
            Username: user.username,
            "Full Name": user.full_name || "",
            Role: user.role,
            Points: user.points,
            Level: user.level,
            "Created At": new Date(user.created_at).toLocaleDateString(),
          }));
          filename = "users.csv";
          break;

        case "activities":
          data = activities.map((activity) => ({
            Title: activity.title,
            Description: activity.description || "",
            Date: activity.date,
            Type: activity.type,
            "Max Participants": activity.max_participants || "Unlimited",
            "Created By": activity.created_by?.username || "",
            "Created At": new Date(activity.created_at).toLocaleDateString(),
          }));
          filename = "activities.csv";
          break;

        case "contributions":
          data = contributions.map((contrib) => ({
            Member: contrib.member?.username || "",
            "Member Full Name": contrib.member?.full_name || "",
            Description: contrib.description,
            Points: contrib.points,
            Type: contrib.contribution_type,
            Date: contrib.date,
            "Recorded By": contrib.recorded_by?.username || "",
            Activity: contrib.activity?.title || "",
            "Created At": new Date(contrib.created_at).toLocaleDateString(),
          }));
          filename = "contributions.csv";
          break;

        default:
          throw new Error("Invalid export type");
      }

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(","),
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`,
      );
      return { error: null };
    } catch (error) {
      console.error("Error exporting data:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  // Notification management
  createNotification: async (userId, title, message) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: userId,
            title,
            message,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log("Notification created:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error creating notification:", error);
      return { data: null, error: error.message };
    }
  },

  broadcastNotification: async (title, message, targetRole = null) => {
    try {
      const { profile, users } = get();

      if (
        !profile ||
        !["admin", "president", "vice_president"].includes(profile.role)
      ) {
        throw new Error("You don't have permission to broadcast notifications");
      }

      let targetUsers = users;
      if (targetRole) {
        targetUsers = users.filter((user) => user.role === targetRole);
      }

      const notifications = targetUsers.map((user) => ({
        user_id: user.id,
        title,
        message,
      }));

      const { data, error } = await supabase
        .from("notifications")
        .insert(notifications)
        .select();

      if (error) throw error;

      toast.success(`Notification sent to ${targetUsers.length} users`);
      console.log("Broadcast notification sent:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  // Activity registration management
  registerForActivity: async (activityId) => {
    try {
      const { profile } = get();
      if (!profile) throw new Error("You must be logged in");

      const { data, error } = await supabase
        .from("activity_participants")
        .insert([
          {
            activity_id: activityId,
            member_id: profile.id,
            status: "registered",
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You are already registered for this activity");
        }
        throw error;
      }

      toast.success("Successfully registered for activity!");
      console.log("Activity registration:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error registering for activity:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  unregisterFromActivity: async (activityId) => {
    try {
      const { profile } = get();
      if (!profile) throw new Error("You must be logged in");

      const { error } = await supabase
        .from("activity_participants")
        .delete()
        .eq("activity_id", activityId)
        .eq("member_id", profile.id);

      if (error) throw error;

      toast.success("Successfully unregistered from activity!");
      console.log("Activity unregistration successful");
      return { error: null };
    } catch (error) {
      console.error("Error unregistering from activity:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  updateParticipationStatus: async (activityId, memberId, status) => {
    try {
      const { profile } = get();
      if (!profile || !get().canCreateActivity()) {
        throw new Error(
          "You don't have permission to update participation status",
        );
      }

      const { data, error } = await supabase
        .from("activity_participants")
        .update({ status })
        .eq("activity_id", activityId)
        .eq("member_id", memberId)
        .select()
        .single();

      if (error) throw error;

      toast.success("Participation status updated successfully!");
      console.log("Participation status updated:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating participation status:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  getActivityParticipants: async (activityId) => {
    try {
      const { data, error } = await supabase
        .from("activity_participants")
        .select(
          `
          *,
          member:profiles!activity_participants_member_id_fkey(id, username, full_name, role, points, level)
        `,
        )
        .eq("activity_id", activityId);

      if (error) throw error;

      console.log("Activity participants fetched:", data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error fetching activity participants:", error);
      return { data: [], error: error.message };
    }
  },

  // Advanced analytics
  getDetailedAnalytics: () => {
    const { users, activities, contributions } = get();
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate(),
    );

    // Monthly statistics
    const recentContributions = contributions.filter(
      (c) => new Date(c.created_at) >= oneMonthAgo,
    );
    const quarterlyContributions = contributions.filter(
      (c) => new Date(c.created_at) >= threeMonthsAgo,
    );

    // Activity engagement
    const recentActivities = activities.filter(
      (a) => new Date(a.date) >= oneMonthAgo,
    );

    // User engagement scores
    const userEngagement = users
      .map((user) => {
        const userContributions = contributions.filter(
          (c) => c.member_id === user.id,
        );
        const recentUserContributions = userContributions.filter(
          (c) => new Date(c.created_at) >= oneMonthAgo,
        );

        return {
          ...user,
          totalContributions: userContributions.length,
          recentContributions: recentUserContributions.length,
          avgPointsPerContribution:
            userContributions.length > 0
              ? Math.round(user.points / userContributions.length)
              : 0,
          engagementScore:
            recentUserContributions.length * 10 + user.points * 0.1,
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore);

    // Contribution trends
    const contributionTrends = {
      monthly: recentContributions.length,
      quarterly: quarterlyContributions.length,
      averagePointsPerContribution:
        contributions.length > 0
          ? Math.round(
              contributions.reduce((sum, c) => sum + c.points, 0) /
                contributions.length,
            )
          : 0,
    };

    // Role performance
    const rolePerformance = Object.entries(
      users.reduce((acc, user) => {
        if (!acc[user.role]) {
          acc[user.role] = { users: [], totalPoints: 0, totalContributions: 0 };
        }
        acc[user.role].users.push(user);
        acc[user.role].totalPoints += user.points;
        acc[user.role].totalContributions += contributions.filter(
          (c) => c.member_id === user.id,
        ).length;
        return acc;
      }, {}),
    ).map(([role, data]) => ({
      role,
      userCount: data.users.length,
      averagePoints: Math.round(data.totalPoints / data.users.length),
      averageContributions: Math.round(
        data.totalContributions / data.users.length,
      ),
      totalPoints: data.totalPoints,
    }));

    return {
      userEngagement,
      contributionTrends,
      rolePerformance,
      recentActivity: {
        contributions: recentContributions.length,
        activities: recentActivities.length,
        newUsers: users.filter((u) => new Date(u.created_at) >= oneMonthAgo)
          .length,
      },
    };
  },

  // Batch operations
  batchUpdateContributions: async (contributionUpdates) => {
    try {
      const { profile } = get();

      if (!profile || !["admin", "president"].includes(profile.role)) {
        throw new Error("You don't have permission to perform batch updates");
      }

      const promises = contributionUpdates.map((update) =>
        get().updateContribution(update.id, update.data),
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error("Some batch updates failed:", failed);
        toast.warning(
          `${successful.length}/${contributionUpdates.length} updates succeeded`,
        );
      } else {
        toast.success(
          `Successfully updated ${contributionUpdates.length} contributions`,
        );
      }

      return {
        successful: successful.length,
        failed: failed.length,
        error: failed.length > 0 ? "Some updates failed" : null,
      };
    } catch (error) {
      console.error("Error performing batch update:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return {
        successful: 0,
        failed: contributionUpdates.length,
        error: message,
      };
    }
  },

  // Backup and restore (admin only)
  createBackup: async () => {
    try {
      const { profile } = get();

      if (!profile || profile.role !== "admin") {
        throw new Error("Only admins can create backups");
      }

      const { users, activities, contributions } = get();

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          users: users.map((u) => ({
            id: u.id,
            username: u.username,
            full_name: u.full_name,
            role: u.role,
            points: u.points,
            level: u.level,
            created_at: u.created_at,
          })),
          activities,
          contributions,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `club-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Backup created successfully!");
      return { error: null };
    } catch (error) {
      console.error("Error creating backup:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      return { error: message };
    }
  },

  // Real-time data synchronization
  setupRealTimeSubscriptions: () => {
    const subscriptions = [];

    // Subscribe to profile changes
    const profileSub = supabase
      .channel("profiles_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Profile change received:", payload);
          get().fetchUsers();
        },
      )
      .subscribe();

    // Subscribe to activity changes
    const activitySub = supabase
      .channel("activities_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        (payload) => {
          console.log("Activity change received:", payload);
          get().fetchActivities();
        },
      )
      .subscribe();

    // Subscribe to contribution changes
    const contributionSub = supabase
      .channel("contributions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        (payload) => {
          console.log("Contribution change received:", payload);
          get().fetchContributions();
          get().fetchUsers(); // Refresh to get updated points
        },
      )
      .subscribe();

    subscriptions.push(profileSub, activitySub, contributionSub);

    // Store subscriptions for cleanup
    set({ realTimeSubscriptions: subscriptions });

    return subscriptions;
  },

  cleanupRealTimeSubscriptions: () => {
    const { realTimeSubscriptions } = get();
    if (realTimeSubscriptions) {
      realTimeSubscriptions.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
      set({ realTimeSubscriptions: null });
    }
  },

  // Error handling and retry logic
  retryOperation: async (operation, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        console.error(
          `Operation failed (attempt ${attempt}/${maxRetries}):`,
          error,
        );

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  },
}));

export default useStore;
