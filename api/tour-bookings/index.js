import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_type', 'tour');
      
      if (error) throw error;
      return res.status(200).json(keysToCamel(data));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        tourId,
        tourName,
        customerName,
        email,
        phone,
        passengers,
        startDate,
        duration,
        amount,
        pricePerPerson,
        specialRequests,
        destination,
        bookingType = 'tour',
        paymentStatus = 'Pending',
        bookingStatus = 'Confirmed',
      } = req.body;

      const bookingId = 'PT' + Date.now().toString().slice(-8);

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          booking_id: bookingId,
          tour_id: tourId,
          tour_name: tourName,
          customer_name: customerName,
          email,
          phone,
          passengers,
          travel_date: startDate,
          duration,
          amount,
          price_per_person: pricePerPerson,
          origin: destination,
          destination,
          special_requests: specialRequests,
          booking_type: bookingType,
          payment_status: paymentStatus,
          booking_status: bookingStatus,
          created_at: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;
      return res.status(201).json(keysToCamel(data[0]));
    } catch (error) {
      console.error('Tour booking error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
