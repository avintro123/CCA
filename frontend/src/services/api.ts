const API_URL = "http://localhost:3000";

export const fetchStandings = async () => {
  const res = await fetch(`${API_URL}/tournament/standings`);
  if (!res.ok) {
    throw new Error("Failed to fetch standings");
  }
  const data = await res.json();
  return data.data;
};
