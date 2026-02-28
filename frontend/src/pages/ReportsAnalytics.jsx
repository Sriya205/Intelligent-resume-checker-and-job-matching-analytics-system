import { useEffect, useState } from "react";
import { getReports } from "../services/analyticsService";

function ReportsAnalytics() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        getReports().then(setReports);
    }, []);

    return (
        <div className="p-5">
            <h2>Reports & Analytics</h2>
            {reports.map((r, index) => (
                <div key={index}>
                    <p>{r.title}</p>
                </div>
            ))}
        </div>
    );
}

export default ReportsAnalytics;