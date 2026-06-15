# Google Cloud BigQuery Release Notes Tracker

A premium, interactive web application built with **Python Flask** and **Vanilla HTML/CSS/JS** that fetches, parses, and displays the latest Google Cloud BigQuery release notes. The app provides real-time searching, category-based filtering, and one-click Twitter/X integration for sharing specific updates.

---

## 🚀 Features

- **Live Fetching**: Pulls the official Google Cloud Atom XML feed dynamically on the backend.
- **Granular Parsing**: Parses daily feed entries and breaks them down into individual update cards based on heading categories (*Feature*, *Changed*, *Deprecated*, etc.).
- **Search & Filter Controls**: Real-time title/body search and category pill filtering on the client side.
- **Twitter Web Intent Integration**: Automatically formats and truncates the plain-text description of a chosen update to fit the 280-character limit, prepends hashtags (`#GoogleCloud #BigQuery`), and opens a Twitter sharing intent popup.
- **Premium Aesthetics**: Fully responsive dark mode interface utilizing modern gradients, glassmorphism elements, CSS animations, and native toast notifications.

---

## 📁 Repository Structure

```text
├── templates/
│   └── index.html      # Main HTML interface skeleton
├── static/
│   ├── css/
│   │   └── style.css   # Styling, theme tokens, and animations
│   └── js/
│       └── main.js     # Data fetching, interactive filters, and sharing logic
├── app.py              # Flask server and XML parser
├── .gitignore          # Git exclusions for environments, caches, and raw XML data
└── README.md           # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites

- **Python 3.8+**
- **Flask**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bpallavi03/pallavi-event-talks-app.git
   cd pallavi-event-talks-app
   ```

2. Install Flask:
   ```bash
   pip install Flask
   ```

3. Run the development server:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

---

## 🔗 Technical Details

- **Backend Feed Retrieval**: Uses `urllib.request` and parses XML with the built-in `xml.etree.ElementTree` parser using the Atom schema namespace.
- **Tag Splitting**: Splits entry updates on regex pattern `<h3>(.*?)</h3>` matching.
- **Social Truncator**: Client-side sharing intent scales and truncates description strings dynamically.
