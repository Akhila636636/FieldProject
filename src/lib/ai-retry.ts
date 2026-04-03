export type RetryStatusUpdate = (status: string) => void;

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  statusCallback?: RetryStatusUpdate;
  fallbackFallbackMessage?: string;
  useFallbackFn?: () => Promise<any>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withAiRetryAndFallback<T>(
  primaryCall: () => Promise<{ data?: T; error?: string }>,
  options?: RetryOptions
): Promise<{ data?: T; error?: string }> {
  const maxRetries = options?.maxRetries ?? 3;
  let delay = options?.initialDelayMs ?? 2000;
  const statusCallback = options?.statusCallback;

  // Let's attempt the primary request with retries
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await primaryCall();

      if (result.error && (result.error.includes("RATE_LIMIT") || result.error.includes("OVERLOAD"))) {
        throw new Error(result.error); // Handled by retry loop
      }

      // If it's a non-retryable structural error or authorization, bypass retries and fallback
      if (result.error && (result.error.includes("API Error") || result.error.includes("configured") || result.error.includes("fetch"))) {
         break;
      }

      // Other standard errors (e.g. content policy, structural failure in chat logic)
      if (result.error) {
        return result; 
      }

      return result;

    } catch (error: any) {
      if (attempt <= maxRetries) {
        statusCallback?.(`⏳ The AI is a bit busy right now… trying again...`);
        await sleep(delay);
        // Exponential backoff logic
        delay *= 1.5;
        continue;
      }

      // Out of retries, throw the final error to the fallback
      if (!options?.useFallbackFn) {
        console.error("All retries failed and no fallback available.");
        return { error: "Something went wrong on our side. Please try again in a moment." };
      }
    }
  }

  // If retries failed, transition to the fallback Model
  statusCallback?.("⚡ Switching to backup brain...");

  try {
    if (options?.useFallbackFn) {
      const fallbackResult = await options.useFallbackFn();
      if (fallbackResult.error) {
         return { error: "Something went wrong on our side. Please try again in a moment." };
      }
      return fallbackResult;
    }
  } catch (fallbackError) {
    console.error("Fallback also failed", fallbackError);
  }

  return { error: "Something went wrong on our side. Please try again in a moment." };
}
