import { useEffect, useState } from "react";
import { getCandidateRanking } from "../services/candidateService";

function CandidateRanking() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    getCandidateRanking().then(setCandidates);
  }, []);

  return (
    <div className="p-5">
      <h2>Candidate Ranking</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, index) => (
            <tr key={index}>
              <td>{c.name}</td>
              <td>{c.score}</td>
              <td>{index + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateRanking;