import { LoginPage } from "../pages/login/LoginPage";
import { RegistrationPage } from "../pages/registration/RegistrationPage";
import { Navigate, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/registration" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/registration" replace />} />
    </Routes>
  );
}

export default App;
