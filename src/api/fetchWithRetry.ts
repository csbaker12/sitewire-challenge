const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry<T>(
  url: string,
  init?: RequestInit,
  retries = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
