import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SmartConverter from './components/SmartConverter';
import TextDiffTool from './components/TextDiffTool';
import ListWizard from './components/ListWizard';
import TimeConverter from './components/TimeConverter';
import About from './components/About';

type EncodingType = 'base64' | 'url' | 'jwt' | 'hex' | 'unicode';

function AppContent() {
  const [activeTab, setActiveTab] = useState('converter');
  const location = useLocation();

  // SmartConverter state
  const [converterState, setConverterState] = useState({
    leftText: '',
    rightText: '',
    encodingType: 'base64' as EncodingType,
    isHighlightMode: false,
    isSorted: false,
    isBeautified: false,
  });

  // TextDiffTool state
  const [diffState, setDiffState] = useState({
    leftText: '',
    rightText: '',
    diffMode: 'lines' as 'chars' | 'lines',
  });

  // ListWizard state
  const [wizardState, setWizardState] = useState({
    listA: '',
    listB: '',
  });

  // TimeConverter state
  const [timeState, setTimeState] = useState({
    input: '',
    selectedTimezones: ['UTC', 'PST/PDT'] as string[],
  });

  const tabs = [
    { id: 'converter', label: 'Smart Converter' },
    { id: 'diff', label: 'Diff Master' },
    { id: 'wizard', label: 'List Wizard' },
    { id: 'time', label: 'Time Converter' }
  ];

  // If we're on the about page, don't show the main app layout
  if (location.pathname === '/about') {
    return <About />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center mr-4 group">
                <img 
                  src="/tooly-icon.svg" 
                  alt="Tooly Logo" 
                  className="w-8 h-8 mr-3 group-hover:scale-110 transition-transform"
                />
                <h1 className="text-2xl font-bold text-stone-900 font-mono tracking-tight">Tooly</h1>
              </Link>
              <span className="ml-3 text-sm text-stone-500 font-medium hidden sm:block">Simple tools for everyday coding</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                to="/about" 
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors font-medium"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-stone-200">
          <nav className="-mb-px flex space-x-1 sm:space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'converter' && (
          <SmartConverter state={converterState} setState={setConverterState} />
        )}
        {activeTab === 'diff' && (
          <TextDiffTool state={diffState} setState={setDiffState} />
        )}
        {activeTab === 'wizard' && (
          <ListWizard state={wizardState} setState={setWizardState} />
        )}
        {activeTab === 'time' && (
          <TimeConverter state={timeState} setState={setTimeState} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-8">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-stone-500">
            Have feedback? Open an issue on{' '}
            <a 
              href="https://github.com/chken007/tooly/issues" 
              className="text-orange-500 hover:text-orange-600 transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;
