const axios = require('axios');

async function test() {
  const { buildStructuredDietPrompt, getPeriods } = require('./src/utils/planPromptBuilder');
  const { parseAndValidatePlan } = require('./src/utils/planValidator');

  // Use the actual prompt builder
  const profile = { age: 25, gender: 'female', height_cm: 165, weight_kg: 55, goal: 'kilo koruma', diet_preference: '', allergy_or_restriction: '', activity_level: 'orta', exercise_days_per_week: 3, sleep_hours: 7 };
  const classification = { bmi: 20.2, level: 'normal' };
  const prompt = buildStructuredDietPrompt(profile, classification, 'weekly');

  console.log('=== PROMPT LENGTH:', prompt.length, '===');
  console.log(prompt.substring(0, 500));
  console.log('...');

  try {
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.1:8b',
      prompt,
      stream: false,
      options: { num_predict: 6000, temperature: 0.7 }
    }, { timeout: 300000 });
    
    console.log('\n=== RAW RESPONSE (len=' + res.data.response.length + ') ===');
    console.log(res.data.response.substring(0, 3000));
    console.log('=== END ===');

    const result = parseAndValidatePlan(res.data.response, 'weekly', getPeriods('weekly'), 'diet');
    console.log('\nVALID:', result.valid);
    if (!result.valid) console.log('ERROR:', result.error);
    else {
      let empty = 0, total = 0;
      for (const row of result.data.rows) {
        for (const item of row.items) { total++; if (!item || item === '—' || item === '-') empty++; }
      }
      console.log('Empty:', empty, '/', total);
      console.log('Row0:', JSON.stringify(result.data.rows[0].items));
    }
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
test();
