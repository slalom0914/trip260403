import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

// 권한 체크용 라우터
import PrivateRouter from "./PrivateRouter";
import HomePage from "../components/pages/HomePage";
import MyProfile from "../components/pages/MyProfile";
import MyPlan from "../components/pages/MyPlan";
import WeatherPage from "../components/pages/WeatherPage";
import AdminPage from "../components/admin/apages/AdminPage";
import ErrorPage from "../components/error/ErrorPage";

const readRoleFromStorage = () => localStorage.getItem("role") ?? "";

const AppRouter = () => {
  const [role, setRole] = useState(readRoleFromStorage);

  useEffect(() => {
    const sync = () => setRole(readRoleFromStorage());
    window.addEventListener("storage", sync);
    window.addEventListener("trip-auth-profile-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("trip-auth-profile-updated", sync);
    };
  }, []);

  return (
    <Routes>
      {/* 공개 페이지: 누구나 접근 가능 */}
      <Route path="/home" element={<HomePage />}></Route>
      <Route path="/weather" element={<WeatherPage />}></Route>
      <Route path="/error" element={<ErrorPage />}></Route>

      {/* 권한 필요: ROLE_ADMIN 또는 ROLE_MANAGER, ROLE_MEMBER만 접근 가능 */}
      <Route
        path="/myprofile"
        element={
          <PrivateRouter
            role={role}
            allowedRoles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_MEMBER"]}
          >
            <MyProfile />
          </PrivateRouter>
        }
      ></Route>

      {/* 권한 필요: MANAGER 또는 MEMBER만 접근 가능 */}
      <Route
        path="/myplan"
        element={
          <PrivateRouter
            role={role}
            allowedRoles={["ROLE_MANAGER", "ROLE_MEMBER"]}
          >
            <MyPlan />
          </PrivateRouter>
        }
      ></Route>


      {/* 권한 필요: ADMIN만 접근 가능 */}
      <Route
        path="/admin"
        element={
          <PrivateRouter role={role} allowedRoles={["ROLE_ADMIN"]}>
            <AdminPage />
          </PrivateRouter>
        }
      ></Route>
    </Routes>
  );
};

export default AppRouter;
