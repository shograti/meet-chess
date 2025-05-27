import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/ui/layout";
import HomePage from "../pages/home-page";
import AdminPage from "../pages/admin-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
]);

export default router;
