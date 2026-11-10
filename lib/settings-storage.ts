const TAVILY_KEY_STORAGE = 'danex.tavilyApiKey';
const BIFROST_KEY_STORAGE = 'danex.bifrostVirtualKey';

export interface ApiKeys {
  tavily: string;
  bifrost: string;
}

export function loadApiKeys(): ApiKeys {
  return {
    tavily:
      window.localStorage.getItem(TAVILY_KEY_STORAGE) ??
      process.env.NEXT_PUBLIC_TAVILY_API_KEY ??
      '',
    bifrost:
      window.localStorage.getItem(BIFROST_KEY_STORAGE) ??
      process.env.NEXT_PUBLIC_BIFROST_VIRTUAL_KEY ??
      '',
  };
}

export function saveApiKeys(keys: ApiKeys): void {
  window.localStorage.setItem(TAVILY_KEY_STORAGE, keys.tavily.trim());
  window.localStorage.setItem(BIFROST_KEY_STORAGE, keys.bifrost.trim());
}
