const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-stone-800 mb-6 text-center">
          About Tooly
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-stone-700 mb-4 leading-relaxed">
            Tooly is a free, open-source developer toolbox for everyday coding tasks.
          </p>
          
          <p className="text-base text-stone-600 mb-6 leading-relaxed">
            No ads, no signup, no tracking – just useful tools for engineers.
          </p>
          
          <div className="bg-stone-100 border-l-4 border-stone-400 p-5 rounded-r-lg mb-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-3">Why I Built This</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              I often see teams lose time on small but frequent tasks like JSON formatting, 
              Base64 decoding, timestamp conversion, or quick diffs during debugging.
            </p>
            <p className="text-stone-700 leading-relaxed">
              Most existing tools are cluttered with ads, require registration, or lack the 
              polish expected in modern developer workflows. Tooly is my answer to that – 
              a clean, fast, and reliable set of utilities that just work.
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">About the Name</h2>
            <p className="text-blue-700 leading-relaxed">
              "Tooly" was named by my daughter. Simple, memorable, and perfectly captures what 
              this project is about – a friendly collection of tools.
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <a 
            href="/" 
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Try the Tools
          </a>
          <a 
            href="https://ko-fi.com/hengcui" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            ☕ Buy Me a Coffee
          </a>
          <a 
            href="https://github.com/chken007/tooly" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-stone-700 text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors font-medium"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-6 text-center text-sm text-stone-500">
          Built with ❤️ for developers, by a developer
        </div>
      </div>
    </div>
  );
};

export default About;
