import { NavLink, Route, Routes } from "react-router-dom";
import { cfg } from "./config";
import { FailuresPage } from "./pages/Failures";
import { OverviewPage } from "./pages/Overview";
import { ReposPage } from "./pages/Repos";
import { RunDetailPage } from "./pages/RunDetail";

export function App() {
  return (
    <div>
      <header className="app-header">
        <div className="header-row">
          <div className="brand">
            <div className="brand-mark">S</div>
            <div>
              <h1>{cfg.title}</h1>
              <p>{cfg.subtitle}</p>
            </div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            Overview
          </NavLink>
          <NavLink to="/repos" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Apps
          </NavLink>
          <NavLink to="/failures" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Failures
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/repos" element={<ReposPage />} />
        <Route path="/failures" element={<FailuresPage />} />
        <Route path="/run/:id" element={<RunDetailPage />} />
      </Routes>
    </div>
  );
}
