# 🔧 Tooly

> Simple tools for everyday coding

Tooly is a collection of essential developer tools built with React, TypeScript, and TailwindCSS. It provides a clean, modern interface for common development tasks like encoding/decoding, text comparison, list manipulation, and time conversion.

## ✨ Features

### 🔄 Smart Converter
Advanced encoding and decoding tool supporting multiple formats:
- **Base64** - Bidirectional encoding/decoding with robust error handling
- **URL** - URL encoding and decoding
- **JWT** - JWT token decoding (shows header, payload, and signature)
- **Hex/ASCII** - Hexadecimal and ASCII conversion
- **Unicode Escape** - Unicode escape sequence conversion
- **JSON Beautify** - Format JSON with proper indentation and structure
- **JSON Sort** - Alphabetically sort JSON keys (case-sensitive)
- **Syntax Highlighting** - Collapsible JSON viewer with color-coded syntax

### 📊 Diff Master
Professional text comparison tool:
- Side-by-side text comparison
- Line-by-line difference highlighting
- Clean, readable diff visualization
- Perfect for code reviews and content comparison

### 📝 List Wizard
Powerful list processing utilities:
- List manipulation and transformation
- Multiple formatting options
- Bulk text operations
- Data cleaning and organization

### ⏰ Time Converter
Comprehensive timestamp conversion tool:
- **Auto-detection** - Automatically detects seconds vs milliseconds format
- **Multiple Timezones** - Support for 10 major timezones (UTC, PST/PDT, EST/EDT, CST, IST, JST, SGT, GMT, CET, AEDT/AEST)
- **Batch Processing** - Convert multiple timestamps simultaneously
- **Color-coded Results** - Each timezone has a unique color for easy identification
- **Copy Functionality** - One-click copy for any conversion result

### 🔧 JSON Tools
Dedicated JSON exploration and filtering tool:
- **Interactive Tree View** - Expand/collapse nodes to explore nested JSON structures
- **Expand All / Collapse All** - Quick navigation for large JSON files
- **Search** - Find keys or values with real-time highlighting
- **Click-to-Copy Paths** - Click any key to copy its JQ path (e.g., `.users[0].name`)
- **JQ Filter** - Apply jq-like filters to extract and transform data
  - Path extraction: `.data.users`, `.items[0]`
  - Array iteration: `.users[].name`, `.products[].price`
  - Built-in functions: `keys`, `length`, `type`
- **Syntax Highlighting** - Color-coded values by type (strings, numbers, booleans, null)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**

> 💡 **New to Node.js?** Node.js is a JavaScript runtime that allows you to run JavaScript outside of a browser. It's essential for running React applications.

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/chken007/tooly.git
cd tooly
```

2. **Install dependencies:**
```bash
npm install
```
> This downloads all the required packages listed in `package.json`

3. **Start the development server:**
```bash
npm start
```

4. **Open your browser** and navigate to `http://localhost:3000`

> 🎉 **That's it!** The app should automatically open in your browser. If not, manually go to `http://localhost:3000`

## 🔧 Troubleshooting

### Common Issues

**❌ "command not found: npm"**
- **Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)
- **Check**: Run `node --version` and `npm --version`

**❌ "Port 3000 is already in use"**
- **Solution**: Kill the process using port 3000:
```bash
# On macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

**❌ "Module not found" errors**
- **Solution**: Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

**❌ Page shows blank/empty**
- **Solution**: Check browser console for errors (F12 → Console)
- **Common cause**: JavaScript errors or missing dependencies

**❌ "Permission denied" on macOS/Linux**
- **Solution**: Use `sudo` or fix npm permissions:
```bash
sudo npm install
# OR
npm config set prefix ~/.npm-global
```

### Getting Help

If you're still having issues:
1. Check the [Issues](https://github.com/chken007/tooly/issues) page
2. Create a new issue with your error message
3. Include your operating system and Node.js version

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: TailwindCSS for modern, responsive design
- **Build Tool**: Vite 6.0 (fast, modern build tool)
- **Code Quality**: ESLint for code linting
- **Package Manager**: npm
- **Node.js**: v18+ (tested with v24.12.0)

## 📁 Project Structure

```
tooly/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── SmartConverter.tsx
│   │   ├── TextDiffTool.tsx
│   │   ├── ListWizard.tsx
│   │   ├── TimeConverter.tsx
│   │   ├── JsonTools.tsx
│   │   └── About.tsx
│   ├── utils/             # Utility functions
│   │   ├── base64.ts
│   │   └── formatters.ts
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # Application entry point
│   └── index.css          # Global styles
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── package.json
└── README.md
```

## 🎯 Usage Examples

### Smart Converter
- **Base64**: Encode/decode text, handles malformed input gracefully
- **JWT**: Paste a JWT token to see decoded header and payload
- **Beautify**: Format minified JSON with proper indentation
- **Sort**: Alphabetically sort all JSON keys recursively
- **Highlight**: Interactive JSON viewer with collapsible nodes and syntax highlighting

### Time Converter
- **Single Timestamp**: `1640995200` (automatically detects format)
- **Multiple Timestamps**: 
  ```
  1640995200
  1641081600
  1641168000
  ```
- **Mixed Format**: Supports both seconds and milliseconds in the same input

### Diff Master
- Paste two versions of text to see highlighted differences
- Perfect for comparing code snippets, configurations, or documents

### JSON Tools
- **Explore**: Paste JSON and use the interactive tree to explore nested data
- **Search**: Type in the search box to highlight matching keys/values
- **Filter**: Use JQ expressions like `.users[].name` to extract specific data
- **Example filters**:
  ```
  .data.items[0]           # Get first item
  .users[].email           # Get all emails from users array
  .config.settings.theme   # Navigate nested objects
  keys                     # List all top-level keys
  length                   # Count items in array/object
  ```

## 🎨 Design Features

- **Responsive Design** - Works perfectly on desktop and mobile
- **Modern UI** - Clean interface with custom fonts (Plus Jakarta Sans, JetBrains Mono)
- **Optimized for Large Displays** - Maximum width of 2000px for 2K/4K monitors
- **Consistent UI** - Uniform design language across all tools
- **Professional UX** - Inspired by tools like Postman and VS Code

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Follow the existing code style and conventions
2. Write clean, readable code with meaningful comments
3. Test your changes thoroughly
4. Maintain consistency with the existing UI/UX patterns

### Code Quality Rules

- **Task-Oriented**: Focus on core functionality
- **Code Quality First**: Prioritize readability and maintainability
- **No Overengineering**: Keep solutions simple and practical
- **Consistent Style**: Follow established patterns
- **Performance Optimized**: Efficient algorithms and minimal overhead

## 📧 Feedback

Have feedback or suggestions? Open an issue on [GitHub](https://github.com/chken007/tooly/issues)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏗️ Build for Production

```bash
npm run build
```

This builds the app for production to the `build` folder. The build is minified and optimized for best performance.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

**One-click deployment:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chken007/tooly)

**Manual deployment:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `npm run deploy`
3. Follow the prompts to configure your project

**Git-based deployment:**
1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on every push to main branch
3. Get instant previews for pull requests

### Other Deployment Options

#### Netlify
1. Run `npm run build`
2. Drag and drop the `build` folder to Netlify dashboard
3. Or use Netlify CLI: `netlify deploy --prod --dir=build`

#### GitHub Pages
1. Install gh-pages: `npm install -g gh-pages`
2. Run: `gh-pages -d build`
3. Configure GitHub Pages in repository settings

#### Any Static Host
1. Run `npm run build`
2. Upload the `build` folder contents to your web server

---

**Built with ❤️ for developers, by developers**
