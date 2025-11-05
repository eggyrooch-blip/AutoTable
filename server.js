import express from 'express';
import bodyParser from 'body-parser';
import { generateSpec } from './spec/generator.js';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/api/spec/generate', (req, res) => {
  try {
    const { json_data, entity = 'order', source_root = 'data' } = req.body || {};
    if (!json_data) return res.status(400).json({ error: 'missing json_data' });
    const spec = generateSpec(json_data, entity, source_root);
    res.json({ spec });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Spec server on http://localhost:${port}`);
});


