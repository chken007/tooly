const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-stone-800 mb-6 text-center">
          About Tooly
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-stone-700 mb-4 leading-relaxed">
            Tooly is a free online developer toolbox for JSON, YAML, Base64, and text diff.
          </p>
          
          <p className="text-lg text-stone-700 mb-6 leading-relaxed">
            No ads, no signup – just useful tools for engineers.
          </p>
          
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
            <h2 className="text-xl font-semibold text-orange-800 mb-2">Why Tooly?</h2>
            <ul className="text-orange-700 space-y-1">
              <li>• Fast and reliable encoding/decoding tools</li>
              <li>• Clean, intuitive interface</li>
              <li>• No registration required</li>
              <li>• Built with modern web technologies</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Try Our Tools
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
