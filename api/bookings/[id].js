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
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { bookingStatus } = req.body;
      let query = supabase.from('bookings').update({ booking_status: bookingStatus });
      if (req.body.paymentStatus) {
        query = supabase.from('bookings').update({ booking_status: bookingStatus, payment_status: req.body.paymentStatus });
      }
      const { data, error } = await query.eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: 'Booking not found' });
      return res.status(200).json(keysToCamel(data[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
