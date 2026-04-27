import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "../pages/LoginPage";
import { RegistrationPage } from "../pages/RegistrationPage";
import { Route, Routes } from "react-router-dom";
import { LessonPage } from "../pages/LessonPage";
import { MainLayout } from "./layouts/MainLayout";
import { TestPage } from "../pages/TestPage";

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
        <Route path="/" element={<MainLayout />}>
          <Route path="/test" element={<TestPage />} />
          <Route path="/lesson" element={<LessonPage />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
