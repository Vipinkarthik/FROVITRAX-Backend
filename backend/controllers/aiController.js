import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';

export const upload = multer({ dest: 'uploads/' });

export const analyzeCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  const product_type = req.body.product_type || 'Tomato';

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('product_type', product_type);

    const response = await axios.post('http://localhost:8000/predict', formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error analyzing CSV:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error || err.message });
  } finally {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting temp file:', unlinkErr.message);
    });
  }
};
