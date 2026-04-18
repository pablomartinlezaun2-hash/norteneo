// Client helper to fetch (or retrieve cached) personalized greeting audio
// from the `personalized-greeting` edge function.
//
// Returns a public audio URL or a data URL fallback.

import { supabase } from "@/integrations/supabase/client";

export interface GreetingResponse {
  audioUrl: string;
  cached: boolean;
  durationMs?: number;
}

export async function fetchPersonalizedGreeting(
  firstName: string,
  opts: { locale?: string; voiceVersion?: string } = {}
): Promise<GreetingResponse | null> {
  if (!firstName?.trim()) return null;

  try {
    const { data, error } = await supabase.functions.invoke(
      "personalized-greeting",
      {
        body: {
          firstName: firstName.trim(),
          locale: opts.locale ?? "es",
          voiceVersion: opts.voiceVersion ?? "v3",
        },
      }
    );

    if (error) {
      console.warn("[greeting] invoke error", error);
      return null;
    }
    if ((data as { fallback?: boolean })?.fallback) {
      console.info("[greeting] backend signaled fallback", data);
      return null;
    }
    if (!data?.audioUrl) {
      console.warn("[greeting] no audioUrl in response", data);
      return null;
    }
    return data as GreetingResponse;
  } catch (e) {
    console.warn("[greeting] fetch failed", e);
    return null;
  }
}
