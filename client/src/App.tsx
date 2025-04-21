import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/admin-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/home-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
