import React from "react";
import { NavLink } from "react-router-dom";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Header(){
  const [user] = useAuthState(auth);

  return (
    <header className="topbar">
      <nav className="nav">
        <div className="brand">
          <span className="dot" />
          <span>Padel</span>
        </div>

        <NavLink to="/" className={({isActive})=> isActive ? "active" : ""}>Home</NavLink>
        <NavLink to="/quadra" className={({isActive})=> isActive ? "active" : ""}>Quadra</NavLink>
        <NavLink to="/diferenciais" className={({isActive})=> isActive ? "active" : ""}>Diferenciais</NavLink>
        <NavLink to="/materiais" className={({isActive})=> isActive ? "active" : ""}>Materiais</NavLink>
        <NavLink to="/agendamento" className={({isActive})=> isActive ? "active" : ""}>Agendamento</NavLink>
        <NavLink to="/contato" className={({isActive})=> isActive ? "active" : ""}>Contato</NavLink>

        <div className="spacer" />

        {user ? (
          <span className="badge" title={user.email}>
            <span className="dot" /> E-mail verificado
          </span>
        ) : (
          <NavLink to="/login" className={({isActive})=> "btn btn-ghost" + (isActive ? " active" : "")}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
}
