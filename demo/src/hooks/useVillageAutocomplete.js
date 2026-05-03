import { useState, useEffect, useRef } from "react";
import axios from "axios";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export function useVillageAutocomplete(apiKey) {
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [open, setOpen]             = useState(false);
  const debounceRef                 = useRef(null);
  const controllerRef               = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    if (!query || query.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      controllerRef.current = new AbortController();
      setLoading(true);
      setError("");

      try {
        const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
        const res = await axios.get(`${apiBase}/autocomplete`, {
          params: { q: query.trim(), type: "village" },
          headers: { "X-API-Key": apiKey },
          signal: controllerRef.current.signal,
        });
        setSuggestions(res.data.suggestions || []);
        setOpen(true);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(err.response?.data?.error || "Search failed");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, apiKey]);

  function clear() {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  return { query, setQuery, suggestions, loading, error, open, setOpen, clear };
}
