import React from "react";
import { Outlet } from "react-router-dom";

export default function Layout(){
  return (
    <main className="page-gap">
      <div className="container">
        <Outlet />
      </div>
    </main>
  );
}
