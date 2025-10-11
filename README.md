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
- **Beautify** - JSON, XML, CSS, SQL, and YAML formatting with syntax validation

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
- **Multiple Timezones** - Support for 8 major timezones (PST/PDT, UTC, IST, EST/EDT, CST, JST, GMT, CET)
- **Batch Processing** - Convert multiple timestamps simultaneously
- **Color-coded Results** - Each timezone has a unique color for easy identification
- **Copy Functionality** - One-click copy for any conversion result

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chken007/tooly.git
cd tooly
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS for modern, responsive design
- **Build Tool**: Create React App
- **Code Quality**: ESLint for code linting
- **Package Manager**: npm

## 📁 Project Structure

```
tooly/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── SmartConverter.tsx
│   │   ├── TextDiffTool.tsx
│   │   ├── ListWizard.tsx
│   │   └── TimeConverter.tsx
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # Application entry point
│   └── index.css         # Global styles
├── package.json
└── README.md
```

## 🎯 Usage Examples

### Smart Converter
- **Base64**: Encode/decode text, handles malformed input gracefully
- **JWT**: Paste a JWT token to see decoded header and payload
- **Beautify**: Paste minified JSON/XML to format it beautifully

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

## 🎨 Design Features

- **Responsive Design** - Works perfectly on desktop and mobile
- **Dark/Light Theme Support** - Clean, modern interface
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

### Quick Deploy Script
```bash
./deploy.sh [platform]
```

Supported platforms:
- `vercel` - Deploy to Vercel (recommended)
- `netlify` - Deploy to Netlify
- `github-pages` - Deploy to GitHub Pages

### Manual Deployment
1. Run `npm run build`
2. Deploy the `build` folder to your preferred hosting service:
   - **Vercel**: `vercel --prod`
   - **Netlify**: Drag and drop the `build` folder
   - **GitHub Pages**: `gh-pages -d build`
   - **Any static host**: Upload `build` contents to web root

---

**Built with ❤️ for developers, by developers**
