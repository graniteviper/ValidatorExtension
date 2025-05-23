# 🔌 Chrome Extension - Installation & Usage Guide

## 🚀 Getting Started

Follow the steps below to run the extension locally:

1. **Install Bun**
   - If you haven't already, install [Bun](https://bun.sh/) — a fast JavaScript runtime like Node.js.
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

3. **Install Dependencies**
   ```bash
   bun install
   ```

4. **Build the Extension**
   ```bash
   bun run build
   ```
   This will generate a `dist/` folder with the production-ready code.

5. **Load the Extension in Chrome**
   - Open Chrome and go to: `chrome://extensions`
   - Enable **Developer Mode** (top-right toggle)
   - Click on **Load unpacked**
   - Select the **root folder** of the project (the folder containing `manifest.json`)

6. **Use the Extension**
   - Your extension is now active in Chrome!
   - Click the extension icon to get started and enjoy the features.

---

## 📦 Upcoming

🔜 This extension will soon be published to the [Chrome Web Store](https://chrome.google.com/webstore)!  
Once published, installation will be as simple as one click.

---

## 🔐 Privacy & Usage

This extension uses your **IP address** to determine your **location**. This helps us:
- Ensure that **only one user** is active per device/session.
- Prevent misuse and sharing of access between multiple users.

📌 *We do not store or sell your data.*

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

[MIT](LICENSE)
