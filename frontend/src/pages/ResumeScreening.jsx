import { useState } from "react";
import { uploadResume } from "../services/resumeService";

function ResumeScreening() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Select file first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadResume(formData);
      alert("Uploaded Successfully");
      console.log(res);
    } catch (err) {
      alert("Upload Failed");
    }
  };

  return (
    <div className="p-5">
      <h2>Resume Screening</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default ResumeScreening;