import { Link } from "react-router-dom";

function Sidebar() {
    return (
        <div style={{ width: "200px", background: "#eee", height: "100vh", padding: "10px" }}>
            <h3>Menu</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/resume">Resume Screening</Link></li>
                <li><Link to="/ranking">Candidate Ranking</Link></li>
                <li><Link to="/reports">Reports</Link></li>
                <li><Link to="/jobs">Job Management</Link></li>
                <li><Link to="/emails">Email Automation</Link></li>
                <li><Link to="/ai">Explainable AI</Link></li>
            </ul>
        </div>
    );
}

export default Sidebar;