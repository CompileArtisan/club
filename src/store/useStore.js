import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { supabase, handleSupabaseError } from "../lib/supabase";
import toast from "react-hot-toast";

const useStore = create(
  subscribeWithSelector((set, get) => ({
    // Auth State
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,

    // Data State
    users: [],
    activities: [],
    contributions: [],
    notifications: [],

    // UI State
    activeTab: "dashboard",
    showActivityForm: false,
    showContributionForm: false,

    // Actions
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setShowActivityForm: (show) => set({ showActivityForm: show }),
    setShowContributionForm: (show) => set({ showContributionForm: show }),

    // Auth Actions
    signUp: async (email, password, userData) => {
      try {
        set({ isLoading: true });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,
          },
        });

        if (error) throw error;

        toast.success("Account created! Check your email to verify.");
        return { data, error: null };
      } catch (error) {
        const message = handleSupabaseError(error);
        toast.error(message);
        return { data: null, error: message };
      } finally {
        set({ isLoading: false });
      }
    },

    signIn: async (email, password) => {
      try {
        set({ isLoading: true });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Signed in successfully!");
        return { data, error: null };
      } catch (error) {
        const message = handleSupabaseError(error);
        toast.error(message);
        return { data: null, error: message };
      } finally {
        set({ isLoading: false });
      }
    },

    signOut: async () => {
      try {
        set({ isLoading: true });

        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          users: [],
          activities: [],
          contributions: [],
          notifications: [],
        });

        toast.success("Signed out successfully!");
      } catch (error) {
        const message = handleSupabaseError(error);
        toast.error(message);
      } finally {
        set({ isLoading: false });
      }
    },

    // Profile Actions
    fetchProfile: async (userId) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;

        set({ profile: data });
        return data;
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    },

    updateProfile: async (updates) => {
      try {
        const { user } = get();
        if (!user) throw new Error("No user logged in");

        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;

        set({ profile: data });
        toast.success("Profile updated successfully!");
        return { data, error: null };
      } catch (error) {
        const message = handleSupabaseError(error);
        toast.error(message);
        return { data: null, error: message };
      }
    },

    // Users Actions
    fetchUsers: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("points", { ascending: false });

        if (error) throw error;

        set({ users: data });
        return data;
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },

    // Activities Actions
    fetchActivities: async () => {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select(
            `
            *,
            created_by:profiles!created_by(username, full_name),
            activity_participants(
              member_id,
              status,
              member:profiles(username, full_name)
            )
          `,
          )
          .order("date", { ascending: false });

        if (error) throw error;

        set({ activities: data });
        return data;
      } catch (error) {
        console.error("Error fetching activities:", error);
        return [];
      }
    },

    createActivity: async (activityData) => {
      try {
        const { user } = get();
        if (!user) throw new Error("No user logged in");

        const { data, error } = await supabase
          .from("activities")
          .insert([
            {
              ...activityData,
              created_by: user.id,
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

    updateActivity: async (activityId, updates) => {
      try {
        const { data, error } = await supabase
          .from("activities")
          .update(updates)
          .eq("id", activityId)
          .select(
            `
            *,
            created_by:profiles!created_by(username, full_name)
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
        return { data, error: null };
      } catch (error) {
        const message = handleSupabaseError(error);
        toast.error(message);
        return { data: null, error: message };
      }
    },

    // Contributions Actions
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

        set({ contributions: data });
        return data;
      } catch (error) {
        console.error("Error fetching contributions:", error);
        return [];
      }
    },

    createContribution: async (contributionData) => {
      try {
        const { user, profile } = get();
        if (!user || !profile) throw new Error("No user logged in");

        // Get target user details
        const targetUser = get().users.find(
          (u) => u.id === contributionData.member_id,
        );
        if (!targetUser) throw new Error("Target user not found");

        // Check permissions
        if (!hasPermissionToCreateContribution(profile.role, targetUser.role)) {
          throw new Error(
            "You don't have permission to create contributions for this user",
          );
        }

        // Create contribution in database
        const { data: contribution, error: contributionError } = await supabase
          .from("contributions")
          .insert([
            {
              ...contributionData,
              recorded_by: user.id,
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

        // Update user points using a database function (recommended) or direct update
        const { data: updatedProfile, error: updateError } = await supabase.rpc(
          "increment_user_points",
          {
            user_id: contributionData.member_id,
            points_to_add: contributionData.points,
          },
        );

        // If the RPC function doesn't exist, fall back to direct update
        if (updateError) {
          const { error: directUpdateError } = await supabase
            .from("profiles")
            .update({
              points: targetUser.points + contributionData.points,
            })
            .eq("id", contributionData.member_id);

          if (directUpdateError) {
            console.warn("Error updating points:", directUpdateError);
          }
        }

        // Update local state
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

    // Permission check
    hasPermissionToCreateContribution: (role, targetRole) => {
      const rolesHierarchy = ["admin", "moderator", "user"];
      return rolesHierarchy.indexOf(role) <= rolesHierarchy.indexOf(targetRole);
    },
  })),
);

export default useStore;
