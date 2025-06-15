// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

const EXCEL_FILE = path.join(__dirname, "data.xlsx");

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize Excel file if it doesn't exist
function initializeExcelFile() {
  if (!fs.existsSync(EXCEL_FILE)) {
    const ws = XLSX.utils.json_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StatusData");
    XLSX.writeFile(wb, EXCEL_FILE);
  }
}
initializeExcelFile();

// Helper to read Excel
function readStatusData() {
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets["StatusData"];
  return XLSX.utils.sheet_to_json(ws);
}

// Helper to write Excel
function writeStatusData(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "StatusData");
  XLSX.writeFile(wb, EXCEL_FILE);
}

// Route to get status
app.get("/get-status", (req, res) => {
  const mobile = req.query.mobile;
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ error: "Invalid mobile number" });
  }

  const data = readStatusData();
  const entry = data.find((row) => row.mobile === mobile);

  if (entry) {
    res.json({ name: entry.name, status: entry.status, mobile });
  } else {
    res.json({});
  }
});

// Route to add status
app.post("/add-status", (req, res) => {
  const { name, mobile, status } = req.body;
  if (!name || !mobile || !status || !/^[0-9]{10}$/.test(mobile)) {
    return res
      .status(400)
      .send("All fields are required and number must be 10 digits");
  }

  let data = readStatusData();
  const existingIndex = data.findIndex((row) => row.mobile === mobile);

  if (existingIndex !== -1) {
    data[existingIndex] = { name, mobile, status };
  } else {
    data.push({ name, mobile, status });
  }

  writeStatusData(data);
  res.redirect("/admin.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
