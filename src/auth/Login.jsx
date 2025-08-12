import { useState } from "react";
import { useAuth } from "/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    login(username);
    navigate("/agendamento");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-2 max-w-sm">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Digite seu nome"
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="bg-orange-500 text-white p-2 rounded">
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
