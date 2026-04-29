import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "../pages/LoginPage";
import { RegistrationPage } from "../pages/RegistrationPage";
import { RegistrationLanguagePage } from "../pages/RegistrationLanguagePage";
import { Route, Routes } from "react-router-dom";
import { LessonPage } from "../pages/LessonPage";
import { MainLayout } from "./layouts/MainLayout";
import { TestPage } from "../pages/TestPage";
import { HomePagePlaceholder } from "../pages/HomePagePlaceholder";

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
          <Route index element={<HomePagePlaceholder />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/lesson" element={<LessonPage />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
