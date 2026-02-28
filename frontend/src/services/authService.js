import API from "./api";

// Login
export const loginUser = async (data) => {
  const response = await API.post("/login", data);
  return response.data;
};

// Register (if needed)
export const registerUser = async (data) => {
  const response = await API.post("/register", data);
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await API.get("/me");
  return response.data;
};