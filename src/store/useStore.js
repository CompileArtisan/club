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
        const { user } = get();
        if (!user) throw new Error("No user logged in");

        // Start a transaction-like operation
        const { data: contribution, error: contributionError } = await supabase
          .from("contributions")
          .insert([
            {
              ...contributionData,
              recorded_by: user.id,
            },
          ])
          .select(
            `
            *,
            member:profiles!member_id(id, username, full_name),
            recorded_by:profiles!recorded_by(username, full_name)
          `,
          )
          .single();

        if (contributionError) throw contributionError;

        // Update user points
        const { data: updatedProfile, error: updateError } = await supabase.rpc(
          "increment_user_points",
          {
            user_id: contributionData.member_id,
            points_to_add: contributionData.points,
          },
        );

        if (updateError) {
          console.warn("Error updating points:", updateError);
        }

        // Update local state
        set((state) => ({
          contributions: [contribution, ...state.contributions],
          users: state.users.map((u) =>
            u.id === contributionData.member_id
              ? { ...u, points: u.points + contributionData.points }
              : u,
          ),
          showContributionForm: false,
        }));

        // Create notification
        await supabase.from("notifications").insert([
          {
            user_id: contributionData.member_id,
            title: "Points Awarded!",
            message: `You earned ${contributionData.points} points for: ${contributionData.description}`,
            type: "contribution",
          },
        ]);

        toast.success("Contribution recorded successfully!");
        return { data: contribution, error: null };
      } catch (error) {
        const message = handleSupabaseError(error);
        toast.error(message);
        return { data: null, error: message };
      }
    },

    // Notifications Actions
    fetchNotifications: async () => {
      try {
        const { user } = get();
        if (!user) return [];

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        set({ notifications: data });
        return data;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },

    markNotificationAsRead: async (notificationId) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId);

        if (error) throw error;

        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif,
          ),
        }));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },

    // Utility Actions
    hasRole: (requiredRoles) => {
      const { profile } = get();
      if (!profile) return false;

      if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(profile.role);
      }

      return profile.role === requiredRoles;
    },

    canCreateActivity: () => {
      return get().hasRole(["president", "vice_president", "treasurer"]);
    },

    canCreateContribution: () => {
      return get().hasRole([
        "president",
        "vice_president",
        "treasurer",
        "senior_executive",
      ]);
    },

    // Initialize app data
    initializeApp: async () => {
      const { user } = get();
      if (!user) return;

      await Promise.all([
        get().fetchProfile(user.id),
        get().fetchUsers(),
        get().fetchActivities(),
        get().fetchContributions(),
        get().fetchNotifications(),
      ]);
    },
  })),
);

// Set up auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  useStore.getState().setUser(session?.user ?? null);
  useStore.getState().setLoading(false);

  if (event === "SIGNED_IN" && session?.user) {
    await useStore.getState().initializeApp();
  }
});

export default useStore;
