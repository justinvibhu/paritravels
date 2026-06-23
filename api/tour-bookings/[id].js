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

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('booking_type', 'tour')
        .single();

      if (error) throw error;
      return res.status(200).json(keysToCamel(data));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        bookingStatus,
        paymentStatus,
        specialRequests,
        driverId,
      } = req.body;

      const updatePayload = {};
      if (bookingStatus !== undefined) updatePayload.booking_status = bookingStatus;
      if (paymentStatus !== undefined) updatePayload.payment_status = paymentStatus;
      if (specialRequests !== undefined) updatePayload.special_requests = specialRequests;
      if (driverId !== undefined) updatePayload.driver_id = driverId;

      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', id)
        .eq('booking_type', 'tour')
        .select();

      if (error) throw error;
      return res.status(200).json(keysToCamel(data[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('booking_type', 'tour');

      if (error) throw error;
      return res.status(200).json({ message: 'Tour booking deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
