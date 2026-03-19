import "./index.css";
import Hero from "./components/Hero";
import Register from "./components/Register";

function App() {
  return (
    <>
      <div className="page">
        <Hero />
        <Register />
      </div>
      <footer>Copyright © 2026 Defrost. All rights reserved.</footer>
    </>
  );
}

export default App;
