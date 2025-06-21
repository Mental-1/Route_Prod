"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { getSupabaseClient } from "@/utils/supabase/client";
import { Toast as toast } from "@/components/ui/toast";
import { useRouter } from "next/router";
import { MediaDetailsSchema, PlanDetailsSchema,AdDetailsSchema } from "../validate-details";

// --- Types ---
interface AdDetails {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: string;
  location: string;
  price: number | null;
  isNegotiable: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface MediaDetails {
  images: string[];
  videos: string[];
}

interface PlanDetails {
  id: string | null;
  name: string | null;
  price: number | null;
}

interface AdPostingState {
  adDetails: AdDetails | null | undefined;
  media: MediaDetails;
  selectedPlan: PlanDetails;
  profile_id: string | null;
  payment_status:
    | "pending"
    | "success"
    | "failed"
    | "free"
    | "cancelled"
    | null;
  draftId: string | null;
  loading: boolean;
  error: string | null;
}

interface AdPostingContextType extends AdPostingState {
  updateAdDetails: (details: Partial<AdDetails>) => void;
  updateMedia: (media: Partial<MediaDetails>) => void;
  updateSelectedPlan: (plan: Partial<PlanDetails>) => void;
  updateMetadata: (metadata: Partial<AdPostingState>) => void;
  saveDraftToSupabase: (data: Partial<AdPostingState>) => Promise<void>;
  loadDraftFromSupabase: (draftId: string) => Promise<void>;
  resetAdPosting: () => void;
}

// --- Initial State ---
const initialAdPostingState: AdPostingState = {
  adDetails: {
    title: "",
    description: "",
    condition: "",
    category: "",
    subcategory: "",
    price: null,
    location: "",
    latitude: null,
    longitude: null,
    isNegotiable: false,
  },
  media: {
    images: [],
    videos: [],
  },
  selectedPlan: {
    id: null,
    name: null,
    price: null,
  },
  profile_id: null,
  payment_status: null,
  draftId: null,
  loading: false,
  error: null,
};

// --- Reducer ---
type Action =
  | { type: "UPDATE_AD_DETAILS"; payload: Partial<AdDetails> }
  | { type: "UPDATE_MEDIA"; payload: Partial<MediaDetails> }
  | { type: "UPDATE_SELECTED_PLAN"; payload: Partial<PlanDetails> }
  | { type: "UPDATE_METADATA"; payload: Partial<AdPostingState> }
  | { type: "SET_STATE"; payload: Partial<AdPostingState> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };

function adPostingReducer(
  state: AdPostingState,
  action: Action,
): AdPostingState {
  switch (action.type) {
    case "UPDATE_AD_DETAILS":
      return { ...state, adDetails: { ...state.adDetails, ...action.payload } };
    case "UPDATE_MEDIA":
      return { ...state, media: { ...state.media, ...action.payload } };
    case "UPDATE_SELECTED_PLAN":
      return {
        ...state,
        selectedPlan: { ...state.selectedPlan, ...action.payload },
      };
    case "UPDATE_METADATA":
      return { ...state, ...action.payload };
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return { ...initialAdPostingState };
    default:
      return state;
  }
}

// --- Context ---
const AdPostingContext = createContext<AdPostingContextType | undefined>(
  undefined,
);

// --- Provider ---
export const AdPostingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(adPostingReducer, initialAdPostingState);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // Fetch profile_id on mount
  useEffect(() => {
    const fetchProfileId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        dispatch({ type: "UPDATE_METADATA", payload: { profile_id: user.id } });
      }
    };
    fetchProfileId();
    // eslint-disable-next-line
  }, []);

  // --- Actions ---
  const updateAdDetails = (details: Partial<AdDetails>) => {
    dispatch({ type: "UPDATE_AD_DETAILS", payload: details });
  };

  const updateMedia = (media: Partial<MediaDetails>) => {
    dispatch({ type: "UPDATE_MEDIA", payload: media });
  };

  const updateSelectedPlan = (plan: Partial<PlanDetails>) => {
    dispatch({ type: "UPDATE_SELECTED_PLAN", payload: plan });
  };

  const updateMetadata = (metadata: Partial<AdPostingState>) => {
    dispatch({ type: "UPDATE_METADATA", payload: metadata });
  };

  // --- Optimistic Save Draft ---
  const saveDraftToSupabase = async (data: Partial<AdPostingState>) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const optimisticState = { ...state, ...data };
    dispatch({ type: "SET_STATE", payload: data }); // Optimistic update

    try {
      if (!optimisticState.profile_id) {
        dispatch({
          type: "SET_ERROR",
          payload: "Profile ID not available, cannot save draft.",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      let result;
      if (optimisticState.draftId) {
        result = await supabase
          .from("ad_drafts")
          .update({
            ad_details: optimisticState.adDetails,
            media_details: optimisticState.media,
            selected_plan: optimisticState.selectedPlan,
            payment_status: optimisticState.payment_status,
          })
          .eq("id", optimisticState.draftId)
          .select()
          .single();
      } else {
        result = await supabase
          .from("ad_drafts")
          .insert({
            profile_id: optimisticState.profile_id,
            ad_details: optimisticState.adDetails,
            media_details: optimisticState.media,
            selected_plan: optimisticState.selectedPlan,
            payment_status: optimisticState.payment_status,
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      if (result.data) {
        dispatch({
          type: "SET_STATE",
          payload: { draftId: result.data.id, ...data },
        });
        dispatch({ type: "SET_ERROR", payload: null });
      }
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: "Error saving ad draft" });
      toast({
        title: "Error saving ad draft",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // --- Load Draft ---
  const loadDraftFromSupabase = async (draftId: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { data, error } = await supabase
        .from("ad_drafts")
        .select("*")
        .eq("id", draftId)
        .single();

      if (error) throw error;

      if (data) {
        const parsedAdDetails = AdDetailsSchema.nullable().safeParse(data.ad_details);
          const parsedMedia = MediaDetailsSchema.safeParse(data.media_details);
          const parsedSelectedPlan = PlanDetailsSchema.safeParse(data.selected_plan);

          if (!parsedAdDetails.success || !parsedMedia.success || !parsedSelectedPlan.success) {
            // Handle validation errors, e.g., log them, show a toast, or throw
            console.error("Validation error loading draft:", parsedAdDetails.error || parsedMedia.error || parsedSelectedPlan.error);
            dispatch({ type: "SET_ERROR", payload: "Invalid draft data found." });
            router.push("/post-ad");
            return;
          }

          dispatch({
            type: "SET_STATE",
            payload: {
              adDetails: parsedAdDetails.data, // This is now guaranteed to be AdDetails | null
              media: parsedMedia.data,
              selectedPlan: parsedSelectedPlan.data,
              profile_id: data.profile_id,
              payment_status: data.payment_status,
              draftId: data.id,
            },
          });
      }
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: "Error loading ad draft" });
      router.push("/post-ad");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // --- Reset ---
  const resetAdPosting = () => {
    dispatch({ type: "RESET" });
  };

  // --- Memoized Context Value ---
  const contextValue = useMemo(
    () => ({
      ...state,
      updateAdDetails,
      updateMedia,
      updateSelectedPlan,
      updateMetadata,
      saveDraftToSupabase,
      loadDraftFromSupabase,
      resetAdPosting,
    }),
    [state],
  );

  return (
    <AdPostingContext.Provider value={contextValue}>
      {children}
    </AdPostingContext.Provider>
  );
};

// --- Hook ---
export const useAdPosting = () => {
  const context = useContext(AdPostingContext);
  if (context === undefined) {
    throw new Error("useAdPosting must be used within an AdPostingProvider");
  }
  return context;
};
