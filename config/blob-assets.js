// Blob Storage Asset Configuration
// This file centralizes all blob storage URLs for easy management

const BLOB_BASE_URL = 'https://kre9xoivjggj03of.public.blob.vercel-storage.com';

const blobAssets = {
  // Logo assets
  logos: {
    backupManagement: `${BLOB_BASE_URL}/assets/logos/DBBACKUPLOGO.svg`,
    // Add more logos here as needed
    // mainLogo: `${BLOB_BASE_URL}/assets/logos/main-logo.svg`,
    // footerLogo: `${BLOB_BASE_URL}/assets/logos/footer-logo.svg`,
  },
  
  // Image assets
  images: {
    // Add image assets here as needed
    // heroImage: `${BLOB_BASE_URL}/assets/images/hero.jpg`,
    // backgroundImage: `${BLOB_BASE_URL}/assets/images/background.png`,
  },
  
  // Document assets
  documents: {
    // Booster club and EWA documents
    boosterTreasurersChecklist: `${BLOB_BASE_URL}/assets/documents/booster-treasurers-monthly-checklist.pdf`,
    ewaInsuranceQuestionnaire: `${BLOB_BASE_URL}/assets/documents/ewa-insurance-questionnaire.docx`,
    wolfpackBasicsOctober2025: `${BLOB_BASE_URL}/assets/documents/wolfpack-basics-october-2025.pdf`,
    // Add more document assets here as needed
    // termsOfService: `${BLOB_BASE_URL}/assets/documents/terms.pdf`,
    // privacyPolicy: `${BLOB_BASE_URL}/assets/documents/privacy.pdf`,
  },
  
  // Icon assets
  icons: {
    // Add icon assets here as needed
    // favicon: `${BLOB_BASE_URL}/assets/icons/favicon.ico`,
    // appIcon: `${BLOB_BASE_URL}/assets/icons/app-icon.png`,
  }
};

// Helper function to get asset URL
function getAssetUrl(category, name) {
  if (blobAssets[category] && blobAssets[category][name]) {
    return blobAssets[category][name];
  }
  throw new Error(`Asset not found: ${category}.${name}`);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { blobAssets, getAssetUrl };
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.blobAssets = blobAssets;
  window.getAssetUrl = getAssetUrl;
}
