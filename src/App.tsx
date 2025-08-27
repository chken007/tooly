import React, { useState } from 'react';
import SmartConverter from './components/SmartConverter';
import TextDiffTool from './components/TextDiffTool';
import ListWizard from './components/ListWizard';
import TimeConverter from './components/TimeConverter';

function App() {
  const [activeTab, setActiveTab] = useState('converter');

  const tabs = [
    { id: 'converter', label: 'Smart Converter', component: SmartConverter },
    { id: 'diff', label: 'Diff Master', component: TextDiffTool },
    { id: 'wizard', label: 'List Wizard', component: ListWizard },
    { id: 'time', label: 'Time Converter', component: TimeConverter }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex items-center mr-4">
                <img 
                  src="/tooly-icon.svg" 
                  alt="Tooly Logo" 
                  className="w-8 h-8 mr-3"
                />
                <h1 className="text-2xl font-bold text-gray-900 font-mono">Tooly</h1>
              </div>
              <span className="ml-3 text-sm text-gray-600 font-medium">🔧 Simple tools for everyday coding</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {tabs.map((tab) => {
          const Component = tab.component;
          return activeTab === tab.id ? <Component key={tab.id} /> : null;
        })}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            Have feedback? Send us an email at{' '}
            <a 
              href="mailto:hengcui@adobe.com" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              hengcui@adobe.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
