<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RentMaster AI - Future of Rental</title>
    <link rel="manifest" href="/assets/manifest-DEJcaWvv.json">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
      // Shim process for browser environment to prevent crash on Vercel/Fly
      window.process = window.process || { env: { API_KEY: "" } };
    </script>
    <style>
      :root {
        --color-primary: #3b82f6;
        --color-secondary: #8b5cf6;
        --color-success: #10b981;
        --color-warning: #f59e0b;
        --color-danger: #f43f5e;
        --radius-premium: 2.5rem;
        --shadow-premium: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
      }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
        margin: 0;
      }
      [dir="rtl"] {
        font-family: 'Noto Sans Arabic', sans-serif;
      }
      .bg-aurora {
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
      }
      .text-gradient {
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .skeleton {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: shimmer 2s infinite linear;
      }

      @media print {
        #root { display: none !important; }
        .no-print { display: none !important; }
        .printable-area { display: block !important; }
      }
    </style>

  <link rel="stylesheet" href="/index.css">
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@^19.2.4",
        "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
        "react/": "https://esm.sh/react@^19.2.4/",
        "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
        "recharts": "https://esm.sh/recharts@^3.7.0",
        "react-router-dom": "https://esm.sh/react-router-dom@^7.13.0",
        "@google/genai": "https://esm.sh/@google/genai@^1.40.0",
        "framer-motion": "https://esm.sh/framer-motion@^11.11.11",
        "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
      }
    }
    </script>
  <script type="module" crossorigin src="/assets/index-CLuWusa6.js"></script>
</head>
  <body class="antialiased overflow-x-hidden">
    <div id="root"></div>
</body>
</html>