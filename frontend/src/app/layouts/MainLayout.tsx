import { Outlet } from "react-router-dom";
import { MainSidebar } from "../../widgets/MainSidebar";

export const MainLayout = () => {
  return (
    <div className="flex size-full flex-row">
      <MainSidebar />
      <div className="ml-4 size-full">
        <Outlet />
      </div>
    </div>
  );
};
