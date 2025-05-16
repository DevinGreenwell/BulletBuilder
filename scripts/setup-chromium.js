// scripts/setup-chromium.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create scripts directory if it doesn't exist
const scriptDir = path.join(__dirname);
if (!fs.existsSync(scriptDir)) {
  fs.mkdirSync(scriptDir, { recursive: true });
}

console.log('🔧 Setting up Chromium for PDF generation...');

try {
  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log('📦 Production environment detected. Installing bundled Chromium...');
    try {
      // Install chromium via the @sparticuz/chromium package
      execSync('npx @sparticuz/chromium install', { stdio: 'inherit' });
      console.log('✅ Bundled Chromium installed successfully!');
    } catch (error) {
      console.error('⚠️ Failed to install bundled Chromium:', error.message);
      console.log('PDF generation may fall back to HTML if Chrome is not available.');
    }
  } else {
    console.log('🔍 Development environment detected. Checking for local Chrome installation...');
    
    // Try to detect Chrome installation based on platform
    let chromePath = '';
    let detectionMethod = '';
    
    if (process.platform === 'win32') {
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];
      
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          chromePath = path;
          detectionMethod = 'Windows default location';
          break;
        }
      }
    } else if (process.platform === 'darwin') {
      // macOS
      const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (fs.existsSync(macPath)) {
        chromePath = macPath;
        detectionMethod = 'macOS default location';
      }
    } else {
      // Linux
      try {
        chromePath = execSync('which google-chrome').toString().trim();
        detectionMethod = 'which command';
      } catch (e) {
        // Try common Linux paths
        const linuxPaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium'
        ];
        
        for (const path of linuxPaths) {
          if (fs.existsSync(path)) {
            chromePath = path;
            detectionMethod = 'Linux default location';
            break;
          }
        }
      }
    }
    
    if (chromePath) {
      console.log(`✅ Chrome detected at: ${chromePath} (via ${detectionMethod})`);
      console.log('👉 Set CHROME_PATH environment variable to customize Chrome location.');
    } else {
      console.log('⚠️ Chrome not detected automatically.');
      console.log('👉 To enable PDF generation, please:');
      console.log('   1. Install Google Chrome on your system, or');
      console.log('   2. Set the CHROME_PATH environment variable to your Chrome executable path');
      console.log('   3. For automated environments, use `npx @sparticuz/chromium install`');
    }
  }
  
  console.log('🚀 Chromium setup completed!');
} catch (error) {
  console.error('❌ Error during Chromium setup:', error);
  console.log('PDF generation may not work correctly. Please check the error message above.');
}