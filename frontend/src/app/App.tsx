import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "../pages/LoginPage";
import { RegistrationPage } from "../pages/RegistrationPage";
import { RegistrationLanguagePage } from "../pages/RegistrationLanguagePage";
import { Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { TestPage } from "../pages/TestPage";
import { TestResultPage } from "../pages/TestResultPage";
import { LessonPage } from "../pages/LessonPage";
import { LessonResultsPage } from "../pages/LessonResultsPage";

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
        <Route
          path="/registration/language"
          element={<RegistrationLanguagePage />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route path="/test" element={<TestPage />} />
          <Route path="/test/result" element={<TestResultPage />} />
          <Route path="/lesson" element={<LessonPage />} />
          <Route path="/lesson/result" element={<LessonResultsPage />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
