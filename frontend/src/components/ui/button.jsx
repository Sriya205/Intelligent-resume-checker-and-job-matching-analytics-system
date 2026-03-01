function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 15px",
        background: "#007bff",
        color: "white",
        border: "none",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}

export default Button;