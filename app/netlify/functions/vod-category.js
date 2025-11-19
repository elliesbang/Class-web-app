import { createClient } from './_supabaseClient';

exports.handler = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('vod_category')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
