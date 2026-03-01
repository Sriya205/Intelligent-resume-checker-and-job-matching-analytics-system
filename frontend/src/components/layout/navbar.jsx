import { useAuth } from "../../context/AuthContext";

function Navbar() {
    const { logout } = useAuth();

    return (
        <div style={{ padding: "10px", background: "#222", color: "white" }}>
            <span>AI Resume System</span>
            <button
                onClick={logout}
                style={{ float: "right", background: "red", color: "white" }}
            >
                Logout
            </button>
        </div>
    );
}

export default Navbar;