function Modal({ children }) {
  return (
    <div style={{
      position: "fixed",
      top: "30%",
      left: "40%",
      background: "white",
      padding: "20px",
      border: "1px solid black"
    }}>
      {children}
    </div>
  );
}

export default Modal;