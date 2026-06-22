import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;

// Use the Service Role Key on the backend to bypass RLS for administrative actions
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const sponsorsFilePath = new URL('./sponsors.json', import.meta.url);

const readSponsorsFile = async () => {
  try {
    const contents = await fs.readFile(sponsorsFilePath, 'utf8');
    return JSON.parse(contents || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

const writeSponsorsFile = async (data) => {
  await fs.writeFile(sponsorsFilePath, JSON.stringify(data, null, 2), 'utf8');
};

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

const normalizeSeatLabel = (label) => {
  if (label === null || label === undefined) return '';
  return String(label).trim().toUpperCase();
};

const buildSeatLayout = (seatLabels, capacity = 0) => {
  if (Array.isArray(seatLabels) && seatLabels.length > 0) {
    return seatLabels.map((row, rowIndex) => {
      if (Array.isArray(row)) {
        return row.map((cell, colIndex) => {
          if (typeof cell === 'string') {
            const trimmed = cell.trim();
            const normalized = trimmed.toUpperCase();
            if (normalized === 'AISLE') {
              return { type: 'aisle', label: '', id: `aisle-${rowIndex}-${colIndex}` };
            }
            if (normalized === 'EMPTY' || trimmed === '') {
              return { type: 'empty', label: '', id: `empty-${rowIndex}-${colIndex}` };
            }
            return { type: 'seat', label: trimmed, id: trimmed || `seat-${rowIndex}-${colIndex}` };
          }
          if (isObject(cell)) {
            const type = cell.type || (typeof cell.label === 'string' && cell.label.toLowerCase() === 'aisle' ? 'aisle' : 'seat');
            const label = cell.label || '';
            const id = cell.id || label || `seat-${rowIndex}-${colIndex}`;
            return { type, label, id };
          }
          return { type: 'empty', label: '', id: `empty-${rowIndex}-${colIndex}` };
        });
      }
      return [{ type: 'empty', label: '', id: `empty-${rowIndex}-0` }];
    });
  }

  const columns = 4;
  const rows = [];
  let seatIndex = 0;
  for (let rowIndex = 0; rowIndex < Math.ceil(capacity / columns); rowIndex += 1) {
    const row = [];
    for (let colIndex = 0; colIndex < columns; colIndex += 1) {
      if (seatIndex >= capacity) break;
      const label = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
      row.push({ type: 'seat', label, id: label });
      seatIndex += 1;
    }
    rows.push(row);
  }
  return rows;
};

const findSeatNumberByLabel = (seatLabel, seatLayout) => {
  const normalizedSearch = normalizeSeatLabel(seatLabel);
  if (!normalizedSearch || !Array.isArray(seatLayout)) return null;
  let seatNumber = 0;
  for (const row of seatLayout) {
    for (const cell of row) {
      if (cell.type === 'seat') {
        seatNumber += 1;
        if (normalizeSeatLabel(cell.label) === normalizedSearch) {
          return seatNumber;
        }
      }
    }
  }
  return null;
};

const resolveBookingId = async (bookingId) => {
  if (typeof bookingId === 'number') return bookingId;
  if (typeof bookingId !== 'string') return null;

  if (/^\d+$/.test(bookingId)) {
    return Number(bookingId);
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_id', bookingId)
    .single();

  if (error) return null;
  return data?.id ?? null;
};

const getBookingIdsForDate = async (date) => {
  // Get all bookings for this date that are PENDING or CONFIRMED (not cancelled/completed)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('travel_date', date)
    .in('booking_status', ['pending', 'confirmed']);
  if (error) throw error;
  return (bookings || []).map((booking) => booking.id).filter((id) => id !== null && id !== undefined);
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

    const originFilter = typeof req.query.origin === 'string' ? req.query.origin.trim() : '';
    const destinationFilter = typeof req.query.destination === 'string' ? req.query.destination.trim() : '';

    if (originFilter) {
      query = query.ilike('origin', `%${originFilter}%`);
    }
    if (destinationFilter) {
      query = query.ilike('destination', `%${destinationFilter}%`);
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
  const { name, vehicleNumber, vehicle_number, type, capacity, pricePerDay, price, status, imageUrl, image_url, category, ac, features, rating, reviews, origin, destination } = body;
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
    origin,
    destination,
    seatLabels: body.seatLabels || body.seat_labels || [],
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
    origin,
    destination,
    seat_labels: body.seatLabels || body.seat_labels || [],
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

// --- SPONSORS API ---

app.get('/api/sponsors', async (req, res, next) => {
  try {
    const sponsors = await readSponsorsFile();
    const activeOnly = req.query.active === 'true';
    const filtered = activeOnly ? sponsors.filter((s) => s.active) : sponsors;
    res.json(keysToCamel(filtered));
  } catch (error) {
    next(error);
  }
});

app.post('/api/sponsors', async (req, res, next) => {
  try {
    const { title, description, imageUrl, link, active } = req.body;
    if (!title) return res.status(400).json({ error: 'Sponsor title is required.' });

    const sponsors = await readSponsorsFile();
    const newSponsor = {
      id: `${Date.now()}`,
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      link: link || '',
      active: active === undefined ? true : Boolean(active),
      createdAt: new Date().toISOString(),
    };

    sponsors.push(newSponsor);
    await writeSponsorsFile(sponsors);
    res.status(201).json(keysToCamel(newSponsor));
  } catch (error) {
    next(error);
  }
});

app.put('/api/sponsors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sponsors = await readSponsorsFile();
    const sponsorIndex = sponsors.findIndex((s) => `${s.id}` === `${id}`);
    if (sponsorIndex === -1) return res.status(404).json({ error: 'Sponsor not found.' });

    const sponsor = sponsors[sponsorIndex];
    const updatedSponsor = {
      ...sponsor,
      ...req.body,
      active: req.body.active === undefined ? sponsor.active : Boolean(req.body.active),
      id: sponsor.id,
      createdAt: sponsor.createdAt || new Date().toISOString(),
    };

    sponsors[sponsorIndex] = updatedSponsor;
    await writeSponsorsFile(sponsors);
    res.json(keysToCamel(updatedSponsor));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/sponsors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sponsors = await readSponsorsFile();
    const filtered = sponsors.filter((s) => `${s.id}` !== `${id}`);
    if (filtered.length === sponsors.length) return res.status(404).json({ error: 'Sponsor not found.' });

    await writeSponsorsFile(filtered);
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
    const { date, vehicleId: queryVehicleId } = req.query;

    if (!date) return res.status(400).json({ error: 'date query parameter required' });

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('capacity, seat_labels')
      .eq('id', id)
      .single();

    if (vehicleError) throw vehicleError;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const capacity = vehicle.capacity || 0;
    if (capacity <= 0) {
      return res.status(400).json({ error: 'Vehicle has no capacity configured' });
    }

    // Get ONLY pending/confirmed bookings (exclude cancelled, completed, etc)
    const bookingIds = await getBookingIdsForDate(date);
    let bookedSeatsQuery = supabase
      .from('seat_bookings')
      .select('seat_number, seat_label, passenger_name, booking_id, gender')
      .eq('vehicle_id', id);
    
    if (bookingIds.length > 0) {
      bookedSeatsQuery = bookedSeatsQuery.in('booking_id', bookingIds);
    } else {
      // If no bookings for this date, return empty set (no booked seats)
      bookedSeatsQuery = bookedSeatsQuery.eq('booking_id', -1);
    }
    
    const { data: bookedSeats, error: seatsError } = await bookedSeatsQuery;

    if (seatsError) throw seatsError;

    const seatLayout = buildSeatLayout(vehicle.seat_labels, capacity);
    
    // Create map of booked seats with their details
    const bookedSeatsMap = {};
    (bookedSeats || []).forEach((s) => {
      const normalizedLabel = normalizeSeatLabel(s.seat_label || s.seat_number);
      bookedSeatsMap[normalizedLabel] = {
        passengerName: s.passenger_name || 'N/A',
        gender: s.gender || 'not_specified',
        bookingId: s.booking_id,
      };
    });

    let seatCounter = 0;
    const layout = seatLayout.map((row) => row.map((cell) => {
      if (cell.type !== 'seat') return cell;
      seatCounter += 1;
      const label = cell.label || String(seatCounter);
      const normalizedLabel = normalizeSeatLabel(label);
      const isBooked = !!bookedSeatsMap[normalizedLabel];
      return {
        ...cell,
        label,
        type: 'seat',
        seatNumber: seatCounter,
        booked: isBooked,
        gender: bookedSeatsMap[normalizedLabel]?.gender || null,
      };
    }));

    const availableSeats = [];
    const bookedSeatsList = [];
    const femaleOccupiedSeats = new Set();

    layout.flat().forEach((cell) => {
      if (cell.type !== 'seat') return;
      const normalizedLabel = normalizeSeatLabel(cell.label);
      
      if (cell.booked && bookedSeatsMap[normalizedLabel]) {
        const bookingInfo = bookedSeatsMap[normalizedLabel];
        bookedSeatsList.push({
          seatNumber: cell.seatNumber,
          seatLabel: cell.label,
          passengerName: bookingInfo.passengerName,
          gender: bookingInfo.gender,
          status: 'booked',
        });
        if (bookingInfo.gender === 'female') {
          femaleOccupiedSeats.add(cell.label);
        }
      } else if (!cell.booked) {
        availableSeats.push({
          seatNumber: cell.seatNumber,
          seatLabel: cell.label,
          status: 'available',
        });
      }
    });

    // Identify adjacent female seats
    const adjacentFemaleSeats = new Map();
    const detectAdjacent = (seatLabel) => {
      const match = seatLabel.match(/^([A-Z])(\d+)$/);
      if (!match) return [];
      const [, row, col] = match;
      const colNum = Number(col);
      const adjacent = [];
      // Check same row ±1 column
      if (colNum > 1) adjacent.push(`${row}${colNum - 1}`);
      if (colNum < 4) adjacent.push(`${row}${colNum + 1}`);
      return adjacent;
    };

    availableSeats.forEach((seat) => {
      const adjacent = detectAdjacent(seat.seatLabel);
      const adjacentFemales = adjacent.filter((label) => femaleOccupiedSeats.has(label));
      if (adjacentFemales.length > 0) {
        adjacentFemaleSeats.set(seat.seatLabel, adjacentFemales);
      }
    });

    // Calculate remaining capacity
    const totalBooked = bookedSeatsList.length;
    const totalAvailable = capacity - totalBooked;
    const fullyBooked = totalAvailable <= 0;

    res.json({
      vehicleId: id,
      capacity: capacity,
      totalBooked: totalBooked,
      totalAvailable: totalAvailable,
      fullyBooked: fullyBooked,
      date,
      layout,
      availableSeats,
      bookedSeats: bookedSeatsList,
      adjacentFemaleSeats: Object.fromEntries(adjacentFemaleSeats),
    });
  } catch (error) {
    next(error);
  }
});

// Book seats for a customer (called after booking is created)
app.post('/api/seat-bookings', async (req, res, next) => {
  try {
    const { vehicleId, bookingId, seatNumbers, passengerName, travelDate, vehicleName, origin, destination, passengers } = req.body;

    if (!vehicleId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ error: 'vehicleId and seatNumbers array are required' });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('capacity, seat_labels')
      .eq('id', vehicleId)
      .single();

    if (vehicleError) throw vehicleError;

    let bookingIdValue = null;
    if (typeof bookingId === 'number') {
      bookingIdValue = bookingId;
    } else if (typeof bookingId === 'string' && /^\d+$/.test(bookingId)) {
      bookingIdValue = Number(bookingId);
    }

    if (!bookingIdValue) {
      const bookingPayload = {
        customer_name: passengerName || 'Admin Booking',
        origin: origin || 'Admin',
        destination: destination || 'Admin',
        travel_date: travelDate || null,
        amount: 0,
        vehicle_name: vehicleName || 'Admin Vehicle',
        passengers: 1,
        booking_status: 'confirmed',
      };

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select('id');

      if (bookingError) throw bookingError;
      if (!bookingData || bookingData.length === 0) {
        throw new Error('Failed to create admin booking record');
      }

      bookingIdValue = bookingData[0].id;
    }

    const seatLayout = buildSeatLayout(vehicle?.seat_labels, vehicle?.capacity || 0);
    const seatsPerRow = 4;

    const seatBookings = seatNumbers.map((s) => {
      let seat_number = null;
      let seat_label = null;
      let gender = null;

      if (typeof s === 'number') {
        seat_number = s;
        seat_label = String(s);
      } else if (typeof s === 'string') {
        seat_label = s.trim().toUpperCase();
        const match = seat_label.match(/^([A-Za-z])(\d+)$/);
        if (match) {
          const rowLetter = match[1].toUpperCase();
          const colNum = Number(match[2]);
          const rowIndex = rowLetter.charCodeAt(0) - 65;
          seat_number = rowIndex * seatsPerRow + colNum;
        }

        if (seat_number === null) {
          seat_number = findSeatNumberByLabel(seat_label, seatLayout);
        }

        if (seat_number === null) {
          const n = parseInt(s, 10);
          if (!isNaN(n)) seat_number = n;
        }
      }

      if (Array.isArray(passengers)) {
        const passengerInfo = passengers.find((p) => normalizeSeatLabel(p.seat || p.seatLabel) === normalizeSeatLabel(s));
        if (passengerInfo) {
          gender = (passengerInfo.gender || 'not_specified').toLowerCase();
        }
      }
      // Fallback for single manual booking where 'passengers' array might not be provided
      if (!gender && req.body.gender) {
        gender = req.body.gender;
      }

      if (seat_number === null) {
        throw new Error(`Could not determine seat_number for seat label ${s}`);
      }

      return {
        vehicle_id: vehicleId,
        booking_id: bookingIdValue,
        seat_number,
        seat_label: seat_label || String(seat_number),
        passenger_name: passengerName || 'N/A',
        gender: gender || 'not_specified',
      };
    });

    const { data, error } = await supabase
      .from('seat_bookings')
      .insert(seatBookings)
      .select();

    if (error) {
      // Check if error is due to UNIQUE constraint (seat already booked)
      if (error.code === '23505' || error.message.includes('unique')) {
        throw new Error('One or more seats are already booked. Please select different seats.');
      }
      throw error;
    }

    res.status(201).json(keysToCamel(data));
  } catch (error) {
    next(error);
  }
});

// Validate seat booking before confirmation (race condition prevention)
app.post('/api/validate-seats', async (req, res, next) => {
  try {
    const { vehicleId, seatLabels, date } = req.body;

    if (!vehicleId || !seatLabels || !Array.isArray(seatLabels) || !date) {
      return res.status(400).json({ error: 'vehicleId, seatLabels array, and date are required' });
    }

    // Get vehicle capacity
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('capacity, seat_labels')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const capacity = vehicle.capacity || 0;

    // Get currently booked seats for this date
    const bookingIds = await getBookingIdsForDate(date);
    let bookedSeatsQuery = supabase
      .from('seat_bookings')
      .select('seat_label')
      .eq('vehicle_id', vehicleId);
    
    if (bookingIds.length > 0) {
      bookedSeatsQuery = bookedSeatsQuery.in('booking_id', bookingIds);
    } else {
      bookedSeatsQuery = bookedSeatsQuery.eq('booking_id', -1);
    }

    const { data: bookedSeats, error: seatsError } = await bookedSeatsQuery;

    if (seatsError) throw seatsError;

    const bookedLabels = new Set((bookedSeats || []).map((s) => normalizeSeatLabel(s.seat_label)));
    const normalizedRequested = seatLabels.map((s) => normalizeSeatLabel(s));

    // Check if any requested seat is already booked
    const alreadyBooked = normalizedRequested.filter((label) => bookedLabels.has(label));
    if (alreadyBooked.length > 0) {
      return res.status(409).json({
        error: 'Seat unavailable',
        message: `Seat(s) ${alreadyBooked.join(', ')} are already booked. Please select different seats.`,
        unavailableSeats: alreadyBooked,
      });
    }

    // Check if adding these seats would exceed capacity
    const totalBooked = bookedLabels.size;
    const totalRequested = normalizedRequested.length;
    const totalAfter = totalBooked + totalRequested;

    if (totalAfter > capacity) {
      return res.status(400).json({
        error: 'Overbooking',
        message: `Cannot book ${totalRequested} seat(s). Vehicle has capacity ${capacity}, and ${totalBooked} are already booked. Only ${capacity - totalBooked} seat(s) remaining.`,
        capacity: capacity,
        booked: totalBooked,
        available: capacity - totalBooked,
        requested: totalRequested,
      });
    }

    res.json({
      valid: true,
      message: 'Seats are available',
      capacity: capacity,
      booked: totalBooked,
      available: capacity - totalBooked,
      requestedCount: totalRequested,
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all booked seats for a vehicle (with booking details)
app.get('/api/admin/vehicles/:id/seats', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, capacity, seat_labels')
      .eq('id', id)
      .single();

    if (vehicleError) throw vehicleError;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const { date } = req.query;

    const bookingIds = date ? await getBookingIdsForDate(date) : [];

    let query = supabase
      .from('seat_bookings')
      .select(`
        id,
        seat_number,
        seat_label,
        passenger_name,
        booked_at,
        bookings(*)
      `)
      .eq('vehicle_id', id);

    if (date) {
      if (bookingIds.length > 0) {
        query = query.in('booking_id', bookingIds);
      } else {
        // No bookings for this date, force empty result
        query = query.eq('booking_id', -1);
      }
    }

    const { data: seatBookings, error: seatsError } = await query.order('seat_number', { ascending: true });

    if (seatsError) throw seatsError;

    const seatLayout = buildSeatLayout(vehicle.seat_labels, vehicle.capacity || 0);
    const bookedLabels = new Set((seatBookings || []).map((seat) => normalizeSeatLabel(seat.seat_label || seat.seatLabel || String(seat.seat_number))));

    let seatCounter = 0;
    const layout = seatLayout.map((row) => row.map((cell) => {
      if (cell.type !== 'seat') return cell;
      seatCounter += 1;
      const label = cell.label || String(seatCounter);
      return {
        ...cell,
        label,
        seatNumber: seatCounter,
        booked: bookedLabels.has(normalizeSeatLabel(label)),
      };
    }));

    res.json({
      vehicle: keysToCamel(vehicle),
      seatBookings: keysToCamel(seatBookings || []),
      layout,
      totalAvailable: (layout.flat().filter((cell) => cell.type === 'seat' && !cell.booked)).length,
      totalBooked: (layout.flat().filter((cell) => cell.type === 'seat' && cell.booked)).length,
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