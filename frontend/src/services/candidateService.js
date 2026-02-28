import API from "./api";

// Get candidate ranking
export const getCandidateRanking = async () => {
  const response = await API.get("/candidates/ranking");
  return response.data;
};

// Get single candidate details
export const getCandidateById = async (id) => {
  const response = await API.get(`/candidates/${id}`);
  return response.data;
};