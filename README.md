# 🚀 AI-Powered CRM CSV Importer

An intelligent CRM data import system that automates CSV field mapping using AI. Users can upload CRM exports, preview data, automatically map columns to CRM fields, and import records with validation, error handling, and detailed import statistics.

## 🌟 Overview

Manually importing CRM data is time-consuming and error-prone, especially when CSV files have inconsistent column names.

This application uses AI to:

* Automatically identify and map CSV columns
* Standardize CRM fields
* Normalize status values
* Extract country codes from phone numbers
* Validate records before import
* Generate import summaries and statistics

AI-assisted CRM workflows help reduce manual effort and improve data quality.

## ✨ Features

### 📂 CSV Upload

* Drag-and-drop CSV upload
* Large file support
* CSV validation
* Instant file preview

### 🤖 AI-Powered Mapping

* Automatic column detection
* Intelligent CRM field mapping
* Smart status normalization
* Flexible schema handling

### 📊 Data Processing

* Country code extraction
* Duplicate detection
* Data validation
* Record transformation

### 📈 Import Analytics

* Total records processed
* Successfully imported records
* Skipped records
* Error reporting

### 🎨 User Experience

* Responsive design
* Sticky table headers
* Real-time feedback
* Modern UI

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### AI

* Google Gemini 2.5 Flash

### Data Processing

* CSV Parser
* Custom Data Transformation Pipeline

### Deployment

* Vercel (Frontend)
* Render (Backend)

## 📂 Project Structure

```bash
ai-powered-crm-csv-importer/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── services/
│   └── pages/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── utils/
│
├── README.md
└── package.json
```

## 🚀 Live Demo

### Frontend

```text
https://ai-powered-crm-csv-importer-orcin.vercel.app
```

### Backend

```text
https://ai-powered-crm-csv-importer.onrender.com
```

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Kundank8789/ai-powered-crm-csv-importer.git
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```env
GEMINI_API_KEY=your_api_key
PORT=5000
```

### Run Backend

```bash
npm run server
```

### Run Frontend

```bash
npm run dev
```

## 🎯 Workflow

1. Upload a CRM CSV file.
2. Preview uploaded data.
3. AI analyzes CSV headers.
4. Fields are mapped automatically.
5. User reviews mappings.
6. Data is validated and transformed.
7. Records are imported.
8. Import statistics are displayed.

## 📸 Screenshots

### CSV Upload

```md
![Upload](./screenshots/upload.png)
```

### AI Field Mapping

```md
![Mapping](./screenshots/mapping.png)
```

### Import Results

```md
![Results](./screenshots/results.png)
```

## 📈 Results

✅ CSV Upload & Preview

✅ AI-Powered Field Mapping

✅ Intelligent Status Mapping

✅ Country Code Extraction

✅ Error Handling

✅ Import Analytics

✅ Responsive UI

✅ Production Deployment

## 🔮 Future Enhancements

* Multi-file imports
* CRM integrations (HubSpot, Salesforce, Zoho)
* AI data cleaning
* Duplicate management
* Scheduled imports
* Import history dashboard
* Bulk update operations

## 👨‍💻 Author

**Kulbhushan Kumar**

GitHub: https://github.com/Kundank8789

LinkedIn: Add Your LinkedIn Profile

---

⭐ If you found this project useful, please give it a star on GitHub.
