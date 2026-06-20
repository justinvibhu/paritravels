import { supabase } from "./client";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// --- VEHICLES ---
export const getVehicles = async () => {
  const response = await fetch(`${API_URL}/vehicles`);
  if (!response.ok) throw new Error("Failed to fetch vehicles");
  return response.json();
};

export const addVehicle = async (data: any, imageFile?: File) => {
  let imageUrl = "";
  if (imageFile) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabase.storage.from("vehicle-images").upload(fileName, imageFile);
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from("vehicle-images").getPublicUrl(fileName);
    imageUrl = publicUrlData.publicUrl;
  }

  const response = await fetch(`${API_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, imageUrl })
  });
  if (!response.ok) throw new Error("Failed to add vehicle");
  const newVehicle = await response.json();
  return newVehicle.id || newVehicle[0]?.id;
};

export const updateVehicle = async (vehicleId: string, data: any, imageFile?: File) => {
  let imageUrl = data.imageUrl;
  if (imageFile) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabase.storage.from("vehicle-images").upload(fileName, imageFile);
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from("vehicle-images").getPublicUrl(fileName);
    imageUrl = publicUrlData.publicUrl;
  }
  const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, imageUrl })
  });
  if (!response.ok) throw new Error("Failed to update vehicle");
};

export const deleteVehicle = async (vehicleId: string) => {
  const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete vehicle");
};

// --- SEATS ---
export const getVehicleSeats = async (vehicleId: string) => {
  const { data, error } = await supabase.from('vehicle_seats').select('*').eq('vehicle_id', vehicleId);
  if (error) throw error;
  return data || [];
};

export const updateSeatStatus = async (vehicleId: string, seatId: string, status: "Available" | "Booked" | "Blocked") => {
  const { error } = await supabase.from('vehicle_seats').update({ status }).eq('id', seatId).eq('vehicle_id', vehicleId);
  if (error) throw error;
};

// --- BOOKINGS ---
export const createBooking = async (data: any) => {
  const bookingId = "PT" + Date.now().toString().slice(-8);
  try {
    const { data: newDoc, error } = await supabase.from('bookings').insert([
      { ...data, bookingId, bookingStatus: "Confirmed", paymentStatus: "Pending" }
    ]).select().single();
    if (error) {
      console.error("Supabase error:", error);
      // Fallback: Create booking in localStorage for demo mode
      const booking = { ...data, bookingId, bookingStatus: "Confirmed", paymentStatus: "Pending", createdAt: new Date().toISOString() };
      localStorage.setItem(`booking_${bookingId}`, JSON.stringify(booking));
      return bookingId;
    }
    return bookingId;
  } catch (err) {
    console.error("Booking creation error:", err);
    // Fallback: Create booking in localStorage for demo mode
    const booking = { ...data, bookingId, bookingStatus: "Confirmed", paymentStatus: "Pending", createdAt: new Date().toISOString() };
    localStorage.setItem(`booking_${bookingId}`, JSON.stringify(booking));
    return bookingId;
  }
};

export const getUserBookings = async (userId: string) => {
  try {
    const { data, error } = await supabase.from('bookings').select('*').eq('userId', userId);
    if (error || !data) {
      // Fallback: Get bookings from localStorage
      const bookings: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('booking_')) {
          const booking = JSON.parse(localStorage.getItem(key) || '{}');
          if (booking.userId === userId) {
            bookings.push(booking);
          }
        }
      }
      return bookings;
    }
    return data || [];
  } catch (err) {
    // Fallback: Get bookings from localStorage
    const bookings: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('booking_')) {
        const booking = JSON.parse(localStorage.getItem(key) || '{}');
        if (booking.userId === userId) {
          bookings.push(booking);
        }
      }
    }
    return bookings;
  }
};

export const updateBooking = async (bookingId: string, data: any) => {
  const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update booking");
};

export const deleteBooking = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete booking");
};

export const getAllBookings = async () => {
  const allBookings: any[] = [];
  const bookingIds = new Set<string>();

  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase.from('bookings').select('*');
    if (data && !error) {
      data.forEach((booking: any) => {
        allBookings.push(booking);
        bookingIds.add(booking.bookingId || booking.id);
      });
    }
  } catch (err) {
    console.error("Supabase fetch error:", err);
  }

  // Always also check localStorage to get any bookings stored locally
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('booking_')) {
        const booking = JSON.parse(localStorage.getItem(key) || '{}');
        // Only add if not already in Supabase results (avoid duplicates)
        if (!bookingIds.has(booking.bookingId || booking.id)) {
          allBookings.push(booking);
          bookingIds.add(booking.bookingId || booking.id);
        }
      }
    }
  } catch (err) {
    console.error("LocalStorage fetch error:", err);
  }

  return allBookings;
};

export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
};

// --- TOURS ---
export const getTours = async () => {
  const response = await fetch(`${API_URL}/tours`);
  if (!response.ok) throw new Error("Failed to fetch tours");
  return response.json();
};

export const addTour = async (data: any) => {
  const response = await fetch(`${API_URL}/tours`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to add tour");
  return response.json();
};

export const updateTour = async (tourId: string, data: any) => {
  const response = await fetch(`${API_URL}/tours/${tourId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update tour");
  return response.json();
};

export const deleteTour = async (tourId: string) => {
  const response = await fetch(`${API_URL}/tours/${tourId}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete tour");
};

export const getDrivers = async () => {
  const response = await fetch(`${API_URL}/drivers`);
  if (!response.ok) throw new Error("Failed to fetch drivers");
  return response.json();
};

export const addDriver = async (data: any) => {
  const response = await fetch(`${API_URL}/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to add driver");
  return response.json();
};

export const updateDriver = async (driverId: string, data: any) => {
  const response = await fetch(`${API_URL}/drivers/${driverId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update driver");
  return response.json();
};

export const deleteDriver = async (driverId: string) => {
  const response = await fetch(`${API_URL}/drivers/${driverId}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete driver");
};

// --- WEDDING BOOKINGS ---
export const createWeddingBooking = async (data: any) => {
  const { error } = await supabase.from('wedding_bookings').insert([{ ...data, status: "Pending" }]);
  if (error) throw error;
};

// --- GOODS TRANSPORT ---
export const createGoodsBooking = async (data: any) => {
  const { error } = await supabase.from('goods_bookings').insert([{ ...data, status: "Pending" }]);
  if (error) throw error;
};

// --- CAREER PORTAL ---
export const submitJobApplication = async (data: any, resumeFile: File) => {
  let resumeUrl = "";
  if (resumeFile) {
    const fileName = `${Date.now()}_${resumeFile.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(fileName, resumeFile);
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(fileName);
    resumeUrl = publicUrlData.publicUrl;
  }
  const { error } = await supabase.from('job_applications').insert([{ ...data, resumeUrl, status: "Under Review" }]);
  if (error) throw error;
};

// --- REVIEWS ---
export const getReviews = async () => {
  const { data, error } = await supabase.from('reviews').select('*');
  if (error) throw error;
  return data || [];
};

export const addReview = async (data: any) => {
  const { error } = await supabase.from('reviews').insert([data]);
  if (error) throw error;
};

// --- NOTIFICATIONS ---
export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId);
  if (error) throw error;
  return data || [];
};

export const markNotificationRead = async (id: string) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
};
