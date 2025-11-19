const { createClient } = require('./_supabaseClient');

exports.handler = async (event, context) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('vod_category')
      .select('*')
      .order('sort_order', { ascending: true }); // ← 수정됨!

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