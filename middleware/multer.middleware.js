import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "./public/temp"
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const ext = file.originalname.split('.').pop() || 'image'
      cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
    }
  })

const imageOnlyFilter = (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        const err = new Error('Only image files are allowed.');
        err.statusCode = 400;
        return cb(err);
    }
    cb(null, true)
}

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter
})