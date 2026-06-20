import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;

// Use the Service Role Key on the backend to bypass RLS for administrative actions
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generic helper to convert object keys from snake_case to camelCase
const toCamel = (s) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const isObject = (o) => o === Object(o) && !Array.isArray(o) && typeof o !== 'function';

const keysToCamel = (o) => {
  if (isObject(o)) {
    const n = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  }
  if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  return o;
};

// Get all vehicles
app.get('/api/vehicles', async (req, res, next) => {
  try {
    let query = supabase.from('vehicles').select('*');

    // If a 'status' query parameter is provided, filter by it.
    // This allows the public site to fetch only 'active' vehicles.
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

// Get a single vehicle by ID
app.get('/api/vehicles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single(); // Use .single() to get one object instead of an array

    if (error) {
        if (error.code === 'PGRST116') { // "exact-one" violation when no rows are found
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        throw error;
    }
    
    if (!data) return res.status(404).json({ error: 'Vehicle not found' });

    res.json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

const buildVehiclePayloads = (body) => {
  const { name, vehicleNumber, vehicle_number, type, capacity, pricePerDay, price, status, imageUrl, image_url, category, ac, features, rating, reviews } = body;
  const vehicleNo = vehicleNumber || vehicle_number;
  const resolvedImage = imageUrl || image_url;
  const resolvedPrice = pricePerDay || price;
  const resolvedStatus = status || 'active';
  const normalizedCapacity = capacity !== undefined && capacity !== null ? Number(capacity) : null;

  const camelPayload = {
    name,
    vehicleNumber: vehicleNo,
    type,
    capacity: normalizedCapacity,
    pricePerDay: resolvedPrice,
    status: resolvedStatus,
    imageUrl: resolvedImage,
    category,
    ac,
    features,
    rating,
    reviews,
  };

  const snakePayload = {
    name,
    vehicle_number: vehicleNo,
    type,
    capacity: normalizedCapacity,
    price_per_day: resolvedPrice,
    status: resolvedStatus,
    image_url: resolvedImage,
    category,
    ac,
    features,
    rating,
    reviews,
  };

  return { camelPayload, snakePayload };
};

const tryInsertVehicle = async (payloads) => {
  let lastError;
  for (const payload of payloads) {
    const { data, error } = await supabase.from('vehicles').insert([payload]).select();
    if (!error) return data;
    lastError = error;
    if (error.code !== 'PGRST204') break;
  }
  throw lastError;
};

const tryUpdateVehicle = async (id, payloads) => {
  let lastError;
  for (const payload of payloads) {
    const { data, error } = await supabase.from('vehicles').update(payload).eq('id', id).select();
    if (!error) return data;
    lastError = error;
    if (error.code !== 'PGRST204') break;
  }
  throw lastError;
};

// Add a new vehicle
app.post('/api/vehicles', async (req, res, next) => {
  try {
    console.log('--- Handling POST /api/vehicles ---');
    console.log('Request Body:', req.body);

    const { vehicleNumber, vehicle_number } = req.body;
    const vehicleNo = vehicleNumber || vehicle_number;
    if (!vehicleNo) {
      return res.status(400).json({ error: 'Vehicle number is required.' });
    }

    const { camelPayload, snakePayload } = buildVehiclePayloads(req.body);
    console.log('Creating vehicle with camelPayload:', camelPayload);
    console.log('Creating vehicle with snakePayload:', snakePayload);

    const data = await tryInsertVehicle([camelPayload, snakePayload]);

    if (!data || data.length === 0) {
      throw new Error('Vehicle created but could not be retrieved. Check RLS policies.');
    }

    console.log('DB insert result:', data);
    res.status(201).json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Update a vehicle
app.put('/api/vehicles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicleNumber, vehicle_number } = req.body;
    const vehicleNo = vehicleNumber || vehicle_number;
    if (!vehicleNo) {
      return res.status(400).json({ error: 'Vehicle number is required.' });
    }

    const { camelPayload, snakePayload } = buildVehiclePayloads(req.body);
    console.log('Updating vehicle id', id, 'with camelPayload:', camelPayload);
    console.log('Updating vehicle id', id, 'with snakePayload:', snakePayload);

    const data = await tryUpdateVehicle(id, [camelPayload, snakePayload]);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Delete a vehicle
app.delete('/api/vehicles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch the vehicle to get the image URL
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Throw error if it's not a "not found" error
      throw fetchError;
    }

    // 2. If image URL exists, delete the image from storage
    if (vehicle && vehicle.image_url) {
      try {
        const urlParts = vehicle.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('vehicle-images')
            .remove([fileName]);
          
          if (storageError) {
            // Log the error but don't block the DB deletion
            console.error('Failed to delete image from storage:', storageError.message);
          }
        }
      } catch (e) {
        console.error('Error parsing image URL for deletion:', e.message);
      }
    }

    // 3. Delete the vehicle record from the database
    const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', id);
    if (deleteError) throw deleteError;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- TOURS API ---

// Get all tours
app.get('/api/tours', async (req, res, next) => {
  try {
    let query = supabase.from('tours').select('*');

    // Filter by 'active' status if requested (for public site)
    if (req.query.active) {
      query = query.eq('active', req.query.active === 'true');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

// Add a new tour
app.post('/api/tours', async (req, res, next) => {
  try {
    const { name, description, price, durationDays, active } = req.body;
    const { data, error } = await supabase
      .from('tours')
      .insert([{ 
        name, 
        description, 
        price: Number(price), 
        duration_days: Number(durationDays), 
        active 
      }])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Tour created but could not be retrieved.');
    
    res.status(201).json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Update a tour
app.put('/api/tours/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationDays, active } = req.body;

    const { data, error } = await supabase
      .from('tours')
      .update({ name, description, price: Number(price), duration_days: Number(durationDays), active })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Tour not found' });
    
    res.json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Delete a tour
app.delete('/api/tours/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tours').delete().eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- DRIVERS API ---

// Get all drivers
app.get('/api/drivers', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

// Add a new driver
app.post('/api/drivers', async (req, res, next) => {
  try {
    const { name, licenseNumber, phone, experienceYears, status, imageUrl } = req.body;
    const { data, error } = await supabase
      .from('drivers')
      .insert([{ 
        name, 
        license_number: licenseNumber, 
        phone, 
        experience_years: Number(experienceYears), 
        status: status || 'available',
        image_url: imageUrl
      }])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Driver created but could not be retrieved.');
    
    res.status(201).json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Update a driver
app.put('/api/drivers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, licenseNumber, phone, experienceYears, status, imageUrl } = req.body;

    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        name, 
        license_number: licenseNumber, 
        phone, 
        experience_years: Number(experienceYears), 
        status: status || 'available',
        image_url: imageUrl
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Driver not found' });
    
    res.json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Delete a driver
app.delete('/api/drivers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: driver, error: fetchError } = await supabase.from('drivers').select('image_url').eq('id', id).single();
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (driver && driver.image_url) {
      try {
        const urlParts = driver.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from('driver-images').remove([fileName]);
        }
      } catch (e) {
        console.error('Error parsing/deleting driver image:', e.message);
      }
    }

    const { error: deleteError } = await supabase.from('drivers').delete().eq('id', id);
    if (deleteError) throw deleteError;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- BOOKINGS API ---

// Admin: create user (uses Service Role key, bypasses RLS)
app.post('/api/admin/create-user', async (req, res, next) => {
  try {
    const { email, password, fullName, mobile } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    // Optional admin secret check to prevent abuse in production
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      const provided = req.headers['x-admin-secret'] || req.headers['x-admin-secret'.toLowerCase()];
      if (!provided || provided !== adminSecret) return res.status(403).json({ error: 'Forbidden' });
    }

    // Create the auth user via the Admin API and auto-confirm the email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      // Try to mark the user as confirmed so they can sign in immediately
      email_confirm: true,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { full_name: fullName, mobile }
    });
    if (error) throw error;

    // Insert profile row into users table (snake_case column names)
    try {
      const profileRow = {
        uid: data.user.id,
        full_name: fullName,
        email,
        mobile,
        role: 'customer',
        created_at: new Date().toISOString(),
      };
      const { data: profileData, error: profileError } = await supabase.from('users').insert([profileRow]).select('uid, full_name, email, mobile, role, created_at');
      if (profileError) {
        console.error('Profile insert error:', profileError);
      }
    } catch (e) {
      console.error('Error inserting profile row:', e.message || e);
    }

    res.status(201).json({ user: data.user });
  } catch (err) {
    next(err);
  }
});

// Get all bookings
app.get('/api/bookings', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

// Add a new booking (from public form)
app.post('/api/bookings', async (req, res, next) => {
  try {
    const { customerName, email, phone, origin, destination, travelDate, amount, vehicleName, passengers, paymentMethod } = req.body;

    // Basic validation
    if (!customerName || !travelDate || !amount) {
      return res.status(400).json({ error: 'Missing required booking information.' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        customer_name: customerName,
        user_email: email,
        customer_phone: phone,
        origin: origin || 'TBD',
        destination: destination || 'TBD',
        travel_date: travelDate,
        amount: Number(amount),
        vehicle_name: vehicleName,
        passengers: Number(passengers) || 1,
        payment_method: paymentMethod || 'Online',
        // Default statuses for a new booking
        payment_status: 'pending',
        booking_status: 'pending',
      }])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Booking created but could not be retrieved.');

    res.status(201).json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Update booking status
app.put('/api/bookings/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bookingStatus } = req.body;

    let query = supabase.from('bookings').update({ booking_status: bookingStatus });

    if (/^\d+$/.test(id)) {
      query = query.eq('id', Number(id));
    } else {
      query = query.eq('booking_id', id);
    }

    const { data, error } = await query.select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Booking not found' });

    res.json(keysToCamel(data[0]));
  } catch (error) {
    next(error);
  }
});

// Delete a booking
app.delete('/api/bookings/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = supabase.from('bookings').delete();

    if (/^\d+$/.test(id)) {
      query = query.eq('id', Number(id));
    } else {
      query = query.eq('booking_id', id);
    }

    const { error } = await query;

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- SEAT BOOKINGS API ---

// Get available seats for a vehicle on a specific date
app.get('/api/vehicles/:id/seats', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD format

    if (!date) return res.status(400).json({ error: 'date query parameter required' });

    // Get vehicle capacity
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('capacity')
      .eq('id', id)
      .single();

    if (vehicleError) throw vehicleError;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Get booked seats for this vehicle on this date
    const { data: bookedSeats, error: seatsError } = await supabase
      .from('seat_bookings')
      .select('seat_number, seat_label, passenger_name')
      .eq('vehicle_id', id)
      .gte('booked_at', date + 'T00:00:00')
      .lt('booked_at', date + 'T23:59:59');

    if (seatsError) throw seatsError;

    // Generate available seats (1 to capacity)
    const bookedNumbers = bookedSeats?.map(s => s.seat_number) || [];
    const availableSeats = [];
    const bookedSeatsList = [];

    for (let i = 1; i <= vehicle.capacity; i++) {
      if (bookedNumbers.includes(i)) {
        bookedSeatsList.push({
          seatNumber: i,
          seatLabel: bookedSeats.find(s => s.seat_number === i)?.seat_label || String(i),
          passengerName: bookedSeats.find(s => s.seat_number === i)?.passenger_name || 'N/A',
          status: 'booked'
        });
      } else {
        availableSeats.push({
          seatNumber: i,
          seatLabel: String(i),
          status: 'available'
        });
      }
    }

    res.json({
      vehicleId: id,
      capacity: vehicle.capacity,
      date,
      availableSeats,
      bookedSeats: bookedSeatsList,
      totalAvailable: availableSeats.length,
      totalBooked: bookedSeatsList.length
    });
  } catch (error) {
    next(error);
  }
});

// Book seats for a customer (called after booking is created)
app.post('/api/seat-bookings', async (req, res, next) => {
  try {
    const { vehicleId, bookingId, seatNumbers, passengerName } = req.body;

    if (!vehicleId || !bookingId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ error: 'vehicleId, bookingId, and seatNumbers array are required' });
    }

    // Support seat identifiers as numbers or labels (e.g., 'C4'). Convert labels to numeric seat_number using 4 columns per row.
    const seatsPerRow = 4;
    const seatBookings = seatNumbers.map((s) => {
      let seat_number = null;
      let seat_label = null;

      if (typeof s === 'number') {
        seat_number = s;
        seat_label = String(s);
      } else if (typeof s === 'string') {
        seat_label = s;
        // Parse label like 'C4' -> row 'C' and column 4
        const match = s.match(/^([A-Za-z])(\d+)$/);
        if (match) {
          const rowLetter = match[1].toUpperCase();
          const colNum = Number(match[2]);
          const rowIndex = rowLetter.charCodeAt(0) - 65; // A -> 0
          seat_number = rowIndex * seatsPerRow + colNum;
        } else {
          // fallback: try to parse numeric part
          const n = parseInt(s, 10);
          if (!isNaN(n)) {
            seat_number = n;
          }
        }
      }

      return {
        vehicle_id: vehicleId,
        booking_id: bookingId,
        seat_number: seat_number,
        seat_label: seat_label || String(seat_number || ''),
        passenger_name: passengerName || 'N/A'
      };
    });

    const { data, error } = await supabase
      .from('seat_bookings')
      .insert(seatBookings)
      .select();

    if (error) throw error;

    res.status(201).json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

// Admin: Get all booked seats for a vehicle (with booking details)
app.get('/api/admin/vehicles/:id/seats', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get vehicle info
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, capacity')
      .eq('id', id)
      .single();

    if (vehicleError) throw vehicleError;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Get all seat bookings with booking details
    // Select the related bookings row with all columns to avoid missing-column errors
    const { data: seatBookings, error: seatsError } = await supabase
      .from('seat_bookings')
      .select(`
        id,
        seat_number,
        seat_label,
        passenger_name,
        booked_at,
        bookings(*)
      `)
      .eq('vehicle_id', id)
      .order('seat_number', { ascending: true });

    if (seatsError) throw seatsError;

    res.json({
      vehicle: keysToCamel(vehicle),
      seatBookings: keysToCamel(seatBookings || [])
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Delete a seat booking (free up a seat)
app.delete('/api/seat-bookings/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('seat_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Generic error handler - MUST be the last middleware
app.use((err, req, res, next) => {
  // Print the full error object, as Supabase errors don't use .stack
  console.error('UNHANDLED ERROR:', err);
  
  res.status(500).json({
    error: err.message || 'An unexpected error occurred on the server.',
    details: err.details || err,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));