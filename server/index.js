const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mammoth = require('mammoth');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();
const port = 5000;

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Define the folder where the DOCX files will be temporarily stored.
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('document'), async (req, res) => {
  const docxFilePath = `uploads/${req.file.filename}`;
  const outputDir = `uploads/${req.file.originalname}_images`;

  // Create a directory for saving images.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    const result = await mammoth.convertToHtml({ path: docxFilePath });
    const htmlContent = result.value;

    const $ = cheerio.load(htmlContent);

    $('img').each(function (i, element) {
      const base64Data = $(this).attr('src').replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(`${outputDir}/image_${i}.png`, imageBuffer);
    });

    res.send('Images extracted and saved successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error extracting images.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
