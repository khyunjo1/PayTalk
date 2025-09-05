
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Login from "../pages/login/page";
import AuthCallback from "../pages/auth/callback";
import Stores from "../pages/stores/page";
import Menu from "../pages/menu/page";
import Cart from "../pages/cart/page";
import OrderComplete from "../pages/order-complete/page";
import Orders from "../pages/orders/page";
import Admin from "../pages/admin/page";
import SuperAdmin from "../pages/super-admin/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "/stores",
    element: <Stores />,
  },
  {
    path: "/menu/:storeId",
    element: <Menu />,
  },
  {
    path: "/cart",
    element: <Cart />,
  },
  {
    path: "/order-complete",
    element: <OrderComplete />,
  },
  {
    path: "/orders",
    element: <Orders />,
  },
  {
    path: "/admin",
    element: <Admin />,
  },
  {
    path: "/super-admin",
    element: <SuperAdmin />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
