
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Login from "../pages/login/page";
import SuperLogin from "../pages/super-login/page";
import AuthCallback from "../pages/auth/callback";
import Cart from "../pages/cart/page";
import OrderComplete from "../pages/order-complete/page";
import Admin from "../pages/admin/page";
import AdminDashboard from "../pages/admin-dashboard/page";
import SuperAdmin from "../pages/super-admin/page";
import OwnerOrders from "../pages/owner/orders/page";
import OwnerMenu from "../pages/owner/menu/page";
import AdminOrders from "../pages/admin/orders/page";
import AdminMenu from "../pages/admin/menu/page";
import AdminAnalytics from "../pages/admin/analytics/page";
import AdminStore from "../pages/admin/store/page";
import OrderStatus from "../pages/order-status/[storeId]/page";
import OrderDetail from "../pages/admin/order-detail/[orderId]/page";
import AdminDailyMenu from "../pages/admin/daily-menu/page";
import DailyMenuPage from "../pages/menu/daily/[storeId]/[date]/page";
import DeliverySettings from "../pages/admin/delivery-settings/[storeId]/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AdminDashboard />,
  },
  {
    path: "/homepage",
    element: <Home />,
  },
  {
    path: "/admin-login",
    element: <Login />,
  },
  {
    path: "/super-login",
    element: <SuperLogin />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "/menu/:storeId",
    element: <DailyMenuPage />,
  },
  {
    path: "/menu/:storeId/daily/:date",
    element: <DailyMenuPage />,
  },
  {
    path: "/cart",
    element: <Cart />,
  },
  {
    path: "/order-complete/:orderId",
    element: <OrderComplete />,
  },
  {
    path: "/admin/:storeId",
    element: <Admin />,
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/:storeId/orders",
    element: <AdminOrders />,
  },
  {
    path: "/admin/:storeId/menu",
    element: <AdminMenu />,
  },
  {
    path: "/admin/:storeId/analytics",
    element: <AdminAnalytics />,
  },
  {
    path: "/admin/:storeId/store",
    element: <AdminStore />,
  },
  {
    path: "/super-admin",
    element: <SuperAdmin />,
  },
  {
    path: "/owner/orders",
    element: <OwnerOrders />,
  },
  {
    path: "/owner/menu",
    element: <OwnerMenu />,
  },
  {
    path: "/order-status/:storeId",
    element: <OrderStatus />,
  },
  {
    path: "/admin/:storeId/order-detail/:orderId",
    element: <OrderDetail />,
  },
  {
    path: "/admin/:storeId/daily-menu",
    element: <AdminDailyMenu />,
  },
  {
    path: "/admin/delivery-settings/:storeId",
    element: <DeliverySettings />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
