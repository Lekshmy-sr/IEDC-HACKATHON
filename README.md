# MediScan 💊

MediScan is a clean, modern medicine utility web application designed to help users identify medicines, find nearby pharmacies, and manage their intake schedules effectively.

## 🚀 Features

- **OCR Medicine Identification**: Scan medicine packaging using your camera to automatically identify names using Tesseract.js.
- **Medicine Search**: Real-time search through a comprehensive database (`medidata.json`) for detailed information on various medicines.
- **Nearby Pharmacies**: Locate pharmacies with categorized displays for discount shops and regular medical stores.
- **Smart Intake Schedule**:
  - Add customized medicine schedules (morning, noon, night).
  - Specify food timing (before/after food).
  - Visual status indicators (Time to consume, Upcoming, Missed).
  - LocalStorage and SQLite synchronization.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript
- **Backend**: Python 3.10+ (Flask)
- **Database**: SQLite3
- **OCR Engine**: Tesseract.js
- **Storage**: Browser LocalStorage (for offline availability) & SQLite (for persistent state)

## 📁 Project Structure

```text
IEDC-HACKATHON/
├── app.py              # Main Flask application & API routes
├── database.db         # SQLite database file
├── init_db.py          # Database initialization script
├── requirements.txt    # Python dependencies
├── static/             
│   ├── css/           # Styling files
│   ├── js/            # Client-side application logic
│   ├── medidata.json   # Medicine information database
│   └── locations.json  # Pharmacy location data
└── templates/         
    └── index.html      # Main single-page application template
```

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd IEDC-HACKATHON
```

### 2. Install dependencies
It is recommended to use a virtual environment.
```bash
pip install -r requirements.txt
```

### 3. Initialize the database
Run the setup script to create the necessary SQLite tables.
```bash
python init_db.py
```

### 4. Run the application
Start the Flask development server.
```bash
python app.py
```
The application will be available at `http://127.0.0.1:5000`.

## 📝 Usage

1. **Details Tab**: Use the camera icon to scan a medicine strip or type the name in the search bar.
2. **Locations Tab**: View available pharmacies and check for discount tags.
3. **Schedule Tab**: Click "+" to add a new medicine. Use the color-coded buttons to mark doses as "consumed".

---
*Developed for IEDC Hackathon.*
