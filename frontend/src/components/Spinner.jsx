import "./Spinner.css";

function Spinner({ size = "medium", text = "" }) {
  return (
    <div className="spinner-wrapper">
      <div className={`spinner spinner-${size}`}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}

export default Spinner;