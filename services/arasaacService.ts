
export interface ArasaacResult {
  _id: number;
  keywords: { keyword: string }[];
}

export const searchArasaac = async (query: string): Promise<ArasaacResult[]> => {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Error searching ARASAAC:", e);
    return [];
  }
};

export const getArasaacImageUrl = (id: number) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
