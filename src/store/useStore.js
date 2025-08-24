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
      console.log("👤 Fetching profile for:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("👤 Profile not found - user might be new");
          return null;
        }
        throw error;
      }

      console.log("✅ Profile fetched:", data);
      set({ profile: data });
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  },

  // Data fetching
  fetchUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;

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
      const { data, error } = await supabase
        .from("activities")
        .select(
          `
          *,
          created_by:profiles!created_by(username, full_name)
        `,
        )
        .order("date", { ascending: false });

      if (error) throw error;

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
      const { data, error } = await supabase
        .from("contributions")
        .select(
          `
          *,
          member:profiles!member_id(id, username, full_name),
          recorded_by:profiles!recorded_by(username, full_name),
          activity:activities(title)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

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
          created_by:profiles!created_by(username, full_name)
        `,
        )
        .single();

      if (error) throw error;

      set((state) => ({
        activities: [data, ...state.activities],
        showActivityForm: false,
      }));

      toast.success("Activity created successfully!");
      return { data, error: null };
    } catch (error) {
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },

  createContribution: async (contributionData, userId) => {
    try {
      const { users } = get();

      const targetUser = users.find((u) => u.id === contributionData.member_id);
      if (!targetUser) throw new Error("Target user not found");

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
          member:profiles!member_id(id, username, full_name),
          recorded_by:profiles!recorded_by(username, full_name),
          activity:activities(title)
        `,
        )
        .single();

      if (contributionError) throw contributionError;

      const { error: updateError } = await supabase.rpc(
        "increment_user_points",
        {
          user_id: contributionData.member_id,
          points_to_add: contributionData.points,
        },
      );

      if (updateError) {
        console.warn("Error updating points:", updateError);
      }

      await get().fetchUsers();

      set((state) => ({
        contributions: [contribution, ...state.contributions],
        showContributionForm: false,
      }));

      toast.success("Contribution added successfully!");
      return { data: contribution, error: null };
    } catch (error) {
      const message = handleSupabaseError(error);
      toast.error(message);
      return { data: null, error: message };
    }
  },
}));

export default useStore;
