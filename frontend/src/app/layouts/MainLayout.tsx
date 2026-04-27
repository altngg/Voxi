import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MainSidebar } from "../../widgets/MainSidebar";

export const MainLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex size-full flex-row">
      <MainSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div
        className="size-full transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? "4rem" : "15rem" }}
      >
        <Outlet />
      </div>
    </div>
  );
};
