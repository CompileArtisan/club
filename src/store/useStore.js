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

  // Actions
  setProfile: (profile) => set({ profile }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowActivityForm: (show) => set({ showActivityForm: show }),
  setShowContributionForm: (show) => set({ showContributionForm: show }),

  // Permission functions
  canCreateActivity: () => {
    const { profile } = get();
    return (
      profile &&
      ["president", "vice_president", "treasurer", "senior_executive"].includes(
        profile.role,
      )
    );
  },

  canCreateContribution: () => {
    const { profile } = get();
    return (
      profile &&
      ["president", "vice_president", "treasurer", "senior_executive"].includes(
        profile.role,
      )
    );
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

      console.log("Profile fetched:", data);
      set({ profile: data });
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

      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            username: userData.username || "user",
            full_name: userData.fullName || "",
            role: "member",
            points: 0,
            level: "Bronze",
          },
        ])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violations
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

      console.log("Profile created:", data);
      set({ profile: data });
      toast.success("Profile created successfully!");
      return data;
    } catch (error) {
      console.error("Error creating profile:", error);
      const message = handleSupabaseError(error);
      toast.error(message);
      throw error;
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
    });
  },
}));

export default useStore;
