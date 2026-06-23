import { supabase } from "./client";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// --- VEHICLES ---
export const getVehicles = async (filters?: { status?: string; origin?: string; destination?: string }) => {
  const query = new URLSearchParams();
  if (filters?.status) query.append('status', filters.status.trim());
  if (filters?.origin) query.append('origin', filters.origin.trim());
  if (filters?.destination) query.append('destination', filters.destination.trim());

  const url = `${API_URL}/vehicles${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch vehicles');
  return response.json();
};

export const addVehicle = async (data: any) => {
  console.log('Sending vehicle data:', data);
  const response = await fetch(`${API_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error || errorData?.message || errorMessage;
      console.error('Vehicle creation error response:', response.status, errorData);
    } catch (parseErr) {
      const errorText = await response.text();
      console.error('Vehicle creation error (raw text):', response.status, errorText);
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  const newVehicle = await response.json();
  return newVehicle.id || newVehicle[0]?.id;
};

export const updateVehicle = async (vehicleId: string, data: any) => {
  const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error || errorData?.message || errorMessage;
      console.error('Vehicle update error response:', response.status, errorData);
    } catch (parseErr) {
      const errorText = await response.text();
      console.error('Vehicle update error (raw text):', response.status, errorText);
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
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
    // Build a whitelist payload so we only send known DB columns
    const insertPayload: any = {
      bookingId,
      bookingStatus: "Confirmed",
      paymentStatus: "Pending",
      user_id: data.userId || data.user_id,
      user_email: data.userEmail || data.user_email,
      customer_name: data.customerName || data.customer_name,
      origin: data.origin,
      destination: data.destination,
      route: data.route,
      travel_date: data.travelDate || data.date || data.travel_date,
      vehicle_id: data.vehicleId || data.vehicle_id,
      vehicle_name: data.vehicleName || data.vehicle_name,
      vehicle_number: data.vehicleNumber || data.vehicle_number,
      seat_numbers: data.seatNumbers || data.seat_numbers,
      passengers: data.passengers,
      amount: data.amount || data.totalPrice,
      payment_method: data.paymentMethod || data.payment_method,
      created_at: new Date().toISOString(),
    };

    const { data: newDoc, error } = await supabase.from('bookings').insert([insertPayload]).select().single();
    if (error) {
      console.error("Supabase error:", error);
      // If PostgREST reports missing columns, attempt a minimal retry without optional fields
      if (error.code === 'PGRST204' || (typeof error.message === 'string' && error.message.includes('Could not find the'))) {
        const minimalPayload: any = {
          bookingId,
          bookingStatus: "Confirmed",
          paymentStatus: "Pending",
          user_id: insertPayload.user_id,
          travel_date: insertPayload.travel_date,
          vehicle_id: insertPayload.vehicle_id,
          seat_numbers: insertPayload.seat_numbers,
          amount: insertPayload.amount,
          created_at: insertPayload.created_at,
        };
        try {
          const { data: retryDoc, error: retryErr } = await supabase.from('bookings').insert([minimalPayload]).select().single();
          if (!retryErr) return bookingId;
          console.error('Retry insert also failed:', retryErr);
        } catch (retryCatch) {
          console.error('Retry insert threw:', retryCatch);
        }
      }

      // Fallback: persist booking locally for demo/offline mode
      const booking = { ...data, bookingId, bookingStatus: "Confirmed", paymentStatus: "Pending", createdAt: new Date().toISOString() };
      try {
        localStorage.setItem(`booking_${bookingId}`, JSON.stringify(booking));
      } catch (lsErr) {
        console.error('Failed to write booking to localStorage:', lsErr);
      }
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

export const getSponsors = async (activeOnly = false) => {
  try {
    const response = await fetch(`${API_URL}/sponsors${activeOnly ? '?active=true' : ''}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (err) {
    console.warn('getSponsors: remote fetch failed, falling back to embedded sponsors.json', err);
    try {
      const local = await import('../data/sponsors.json');
      const list = local?.default || local;
      return activeOnly ? list.filter((s: any) => s.active) : list;
    } catch (impErr) {
      console.error('Failed to load local sponsors fallback', impErr);
      throw err;
    }
  }
};

export const addSponsor = async (data: any) => {
  const response = await fetch(`${API_URL}/sponsors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to add sponsor");
  return response.json();
};

export const updateSponsor = async (sponsorId: string, data: any) => {
  const response = await fetch(`${API_URL}/sponsors/${sponsorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update sponsor");
  return response.json();
};

export const deleteSponsor = async (sponsorId: string) => {
  const response = await fetch(`${API_URL}/sponsors/${sponsorId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete sponsor");
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

// --- TOUR BOOKINGS ---
export const createTourBooking = async (data: any) => {
  const response = await fetch(`${API_URL}/tour-bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to create tour booking");
  }
  return response.json();
};

export const getTourBookings = async () => {
  const response = await fetch(`${API_URL}/tour-bookings`);
  if (!response.ok) throw new Error("Failed to fetch tour bookings");
  return response.json();
};

export const getTourBooking = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/tour-bookings/${bookingId}`);
  if (!response.ok) throw new Error("Failed to fetch tour booking");
  return response.json();
};

export const updateTourBooking = async (bookingId: string, data: any) => {
  const response = await fetch(`${API_URL}/tour-bookings/${bookingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update tour booking");
  return response.json();
};

export const deleteTourBooking = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/tour-bookings/${bookingId}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete tour booking");
};
