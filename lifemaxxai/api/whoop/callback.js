  window.syncWhoop = function() {
    // 1. Replace the text below with your actual WHOOP Client ID from the developer portal
    const clientId = "e965a759-3a54-43c1-b112-24ce87225b08";
    
    // Get the current base domain of the application
    const currentDomain = window.location.origin; 
    
    // Dynamically build the exact backend callback path based on environment
    const redirectUrl = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')
      ? `${currentDomain}/api/whoop/callback`
      : `https://vercel.app`;
      
    // Encode parameters safely for the secure OAuth 2.0 handshake URL
    const redirectUri = encodeURIComponent(redirectUrl);
    const scopes = encodeURIComponent("offline read:recovery read:sleep read:workout");
    
    // Build the official secure WHOOP Authorization interface URL
    const whoopAuthUrl = `https://whoop.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;
    
    // Route the user out to the official WHOOP login credentials form
    window.location.href = whoopAuthUrl;
  };
