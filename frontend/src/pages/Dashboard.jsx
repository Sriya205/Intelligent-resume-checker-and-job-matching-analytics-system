import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/analyticsService";

function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  return (
    <div className="p-5">
      <h1>Dashboard</h1>
      <p>Total Candidates: {stats.total_candidates}</p>
      <p>Total Jobs: {stats.total_jobs}</p>
      <p>Shortlisted: {stats.shortlisted}</p>
    </div>
  );
}

export default Dashboard;