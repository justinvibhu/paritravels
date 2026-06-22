
  import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
  import App from "./app/App.tsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import Dashboard from "./admin/Dashboard.jsx";
import BookingsManagement from "./admin/BookingsManagement.jsx";
import CustomersManagement from "./admin/CustomersManagement.jsx";
import DriversManagement from "./admin/DriversManagement.jsx";
import ToursManagement from "./admin/ToursManagement.jsx";
import VehiclesManagement from "./admin/VehiclesManagement.jsx";
import SponsorsManagement from "./admin/SponsorsManagement.tsx";
import { AdminSeatManagement } from "./admin/SeatManagement.jsx";
import "./styles/index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Main frontend application */}
        <Route path="/*" element={<App />} />
        
        {/* Admin Dashboard application */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="customers" element={<CustomersManagement />} />
          <Route path="drivers" element={<DriversManagement />} />
          <Route path="tours" element={<ToursManagement />} />
          <Route path="vehicles" element={<VehiclesManagement />} />
          <Route path="sponsors" element={<SponsorsManagement />} />
          <Route path="seats" element={<AdminSeatManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
  