import API from "./api";

// Upload resume
export const uploadResume = async (formData) => {
    const response = await API.post("/resume/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

// Get all resumes
export const getAllResumes = async () => {
    const response = await API.get("/resume");
    return response.data;
};