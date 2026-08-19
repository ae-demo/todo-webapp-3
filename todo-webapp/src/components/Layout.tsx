import { NavLink, Outlet } from "react-router-dom";
import { signOut } from "../auth";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="navbar">
        <span className="navbar-brand">TodoHub</span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            void signOut();
          }}
        >
          Sign out
        </button>
      </header>
      <div className="app-body">
        <nav className="sidebar">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Tasks
          </NavLink>
          <NavLink
            to="/completed"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Completed
          </NavLink>
          <span className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            Settings
          </span>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
