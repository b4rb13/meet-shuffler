import type { Joke } from "./types";

const JOKE_API_URL =
  "https://v2.jokeapi.dev/joke/Programming?type=twopart&blacklistFlags=nsfw,racist,sexist";

const FALLBACK_JOKES: Joke[] = [
  {
    setup: "Why do programmers prefer dark mode?",
    delivery: "Because light attracts bugs.",
  },
  {
    setup: "Why do Java developers wear glasses?",
    delivery: "Because they can't C#.",
  },
  {
    setup: "A SQL query walks into a bar, walks up to two tables and asks...",
    delivery: '"Can I join you?"',
  },
  {
    setup: "How many programmers does it take to change a light bulb?",
    delivery: "None. That's a hardware problem.",
  },
];

export async function fetchDeveloperJoke(): Promise<Joke> {
  try {
    const res = await fetch(JOKE_API_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error("API error");
    const data = (await res.json()) as { setup?: string; delivery?: string; error?: boolean };
    if (data.error || !data.setup || !data.delivery) throw new Error("Bad joke");
    return { setup: data.setup, delivery: data.delivery };
  } catch {
    return FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
  }
}
