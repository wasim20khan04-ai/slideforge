import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfqqyhdkcpbejogymqgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXF5aGRrY3BiZWpvZ3ltcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTM5MDcsImV4cCI6MjA4MTU2OTkwN30.JDEH7xf2ESZlul4XzfxwicQoP7Qn15BAn9Jp37YstmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('presentations').select('id, name, updated_at').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
