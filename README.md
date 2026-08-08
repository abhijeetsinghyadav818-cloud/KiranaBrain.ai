# KiranaBrain AI Prototype

A packaged version of the KiranaBrain dashboard with a clean folder structure.

- `html/index.html` — app shell and layout
- `css/styles.css` — visual styling
- `js/app.js` — application logic and IndexedDB persistence
- `README.md` — instructions and notes

## How to use

1. Open `html/index.html` in a modern browser.
2. Use the sidebar to switch between Dashboard, Inventory, and AI views.
3. Click the voice button to start a voice command. Supported browsers will transcribe speech and send it as a command.

## Notes

- Voice recognition and speech synthesis work best in Chrome or Edge.
- The voice command may require a secure context (`https://`) for full browser support.
- If voice recognition is unavailable, the app simulates a sample voice command.

## Run locally

For best results, serve the folder over HTTP instead of opening the file directly.

```bash
cd "C:\Users\Abhijeet\Downloads\kiranabrain-package"
python -m http.server 8000
```

Then open `http://localhost:8000`.
