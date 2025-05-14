import Link from 'next/link';

export default function MobileRedirect() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-6">USCG Evaluation Report Generator</h1>
      
      <p className="mb-4">
      We&apos;ve detected you&apos;re using a mobile device. For the best experience, we&apos;ve created a mobile-optimized version.
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link 
          href="/mobile" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
        >
          Go to Mobile Version
        </Link>
        
        <Link 
          href="/" 
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium shadow-md hover:bg-gray-300 transition-colors"
        >
          Continue to Full Version
        </Link>
      </div>
      
      <p className="mt-6 text-sm text-gray-500">
        The mobile version offers core functionality with a simplified interface optimized for smaller screens.
      </p>
    </div>
  );
}
