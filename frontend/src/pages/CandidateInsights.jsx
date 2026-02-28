import { useParams } from "react-router-dom";

function CandidateInsights() {
  const { id } = useParams();

  return (
    <div className="p-5">
      <h2>Candidate Insights</h2>
      <p>Insights for Candidate ID: {id}</p>
    </div>
  );
}

export default CandidateInsights;