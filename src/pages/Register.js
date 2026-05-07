import { useState } from "react";
import axios from "axios";

function Register({ switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      alert("Account created!");
      switchToLogin(); // go back to login
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <h2>Register</h2>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <br />

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleRegister}>Sign Up</button>

      <p>
        Already have an account?{" "}
        <button onClick={switchToLogin}>
          Login
        </button>
      </p>
    </div>
  );
}

export default Register;