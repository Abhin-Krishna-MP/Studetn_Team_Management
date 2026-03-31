require('dotenv').config();

async function checkModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No GEMINI_API_KEY found in .env");
    return;
  }

  const versions = ['v1', 'v1beta'];
  
  for (const v of versions) {
    console.log(`\n--- Checking API version: ${v} ---`);
    try {
      const url = `https://generativelanguage.googleapis.com/${v}/models?key=${key}`;
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (resp.ok) {
        console.log(`Successfully fetched models for ${v}:`);
        if (data.models) {
          data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
          });
        } else {
          console.log("No models array in response.");
        }
      } else {
        console.error(`Error ${resp.status} for ${v}:`, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(`Fetch error for ${v}:`, err.message);
    }
  }
}

checkModels();
