import { setBaseUrl } from "@workspace/api-client-react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://krishi-bazar-f6vc.onrender.com").trim();

if (apiBaseUrl) {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");
  setBaseUrl(normalizedBaseUrl);

  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api")) {
      return originalFetch(`${normalizedBaseUrl}${input}`, init);
    }

    if (input instanceof Request && input.url.startsWith("/api")) {
      return originalFetch(`${normalizedBaseUrl}${input.url}`, init);
    }

    if (input instanceof URL && input.pathname.startsWith("/api")) {
      const target = new URL(input.toString());
      target.protocol = new URL(normalizedBaseUrl).protocol;
      target.host = new URL(normalizedBaseUrl).host;
      target.pathname = `${new URL(normalizedBaseUrl).pathname.replace(/\/+$/, "")}${target.pathname}`;
      return originalFetch(target.toString(), init);
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;
}

createRoot(document.getElementById("root")!).render(<App />);
