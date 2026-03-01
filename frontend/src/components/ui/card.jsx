function Card({ children }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "15px",
      margin: "10px 0",
      borderRadius: "5px"
    }}>
      {children}
    </div>
  );
}

export default Card;