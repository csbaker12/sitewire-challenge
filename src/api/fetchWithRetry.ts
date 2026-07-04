const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Request failed (${response.status} ${response.statusText})`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(attempt * 300);
      }
    }
  }

  throw lastError;
}
