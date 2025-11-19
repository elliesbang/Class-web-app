const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async () => {
  try {
    const { data, error } = await supabase
      .from('vod_class_category')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
