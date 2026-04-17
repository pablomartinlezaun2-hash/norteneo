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
  if (!firstName?.trim()) {
    console.warn("[greeting] no firstName provided to fetcher");
    return null;
  }

  const t0 = performance.now();
  console.info(`[greeting] requesting clip for name="${firstName}"`);

  try {
    const { data, error } = await supabase.functions.invoke(
      "personalized-greeting",
      {
        body: {
          firstName: firstName.trim(),
          locale: opts.locale ?? "es",
          voiceVersion: opts.voiceVersion ?? "v1",
        },
      }
    );

    const elapsed = Math.round(performance.now() - t0);

    if (error) {
      console.warn(`[greeting] invoke error after ${elapsed}ms`, error);
      return null;
    }
    if (!data?.audioUrl) {
      console.warn(`[greeting] no audioUrl in response after ${elapsed}ms`, data);
      return null;
    }

    console.info(
      `[greeting] received audio cached=${data.cached} backendMs=${data.durationMs ?? "n/a"} totalMs=${elapsed}`
    );
    return data as GreetingResponse;
  } catch (e) {
    const elapsed = Math.round(performance.now() - t0);
    console.warn(`[greeting] fetch failed after ${elapsed}ms`, e);
    return null;
  }
}
