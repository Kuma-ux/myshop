import { useState } from "react";
import axios from "axios";
import Register from "./Register";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      window.location.reload();
    } catch (err) {
      alert("Login failed");
    }
  };

  // 👉 SWITCH TO REGISTER PAGE
  if (showRegister) {
    return <Register switchToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div style={{ padding: 50 }}>
      <h2>Login</h2>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleLogin}>Login</button>

      <p>
        Don't have an account?{" "}
        <button onClick={() => setShowRegister(true)}>
          Sign up
        </button>
      </p>
    </div>
  );
}

export default Login;