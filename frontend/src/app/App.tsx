import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "../pages/login/LoginPage";
import { RegistrationPage } from "../pages/registration/RegistrationPage";
import { Navigate, Route, Routes } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  // queryCache: new QueryCache({
  //   onError: (error) => {
  //     useErrorStore.getState().showError(error.message);
  //   },
  // }),
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/registration" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
