// Copy for the generated category landing pages (finance-tools.html, …).
// Each page gets a keyword-focused title/description, an intro, a short
// guide and an FAQ (also emitted as FAQPage structured data).
export const CATEGORY_PAGES = {
  finance: {
    title: "Free Finance Calculators & Money Tools",
    h1: "Finance calculators & money tools",
    description: "Free online finance calculators: currency converter with live rates, loan & EMI, compound interest, salary, retirement, subscriptions and pet costs. Private, no sign-up.",
    intro: "Make money decisions with real numbers. Convert currencies at live rates, plan a loan, watch compound interest grow your savings and find the subscriptions quietly draining your budget.",
    body: [
      "Every finance calculator here runs entirely in your browser, so the salaries, balances and loan amounts you type are never uploaded. Live tools such as the currency converter and crypto tracker fetch public market data, but your inputs stay on your device.",
      "Start with the <a href=\"compound-interest-calculator.html\">compound interest calculator</a> to see how monthly contributions add up over decades, use the <a href=\"loan-calculator.html\">loan &amp; EMI calculator</a> to compare repayment terms before you borrow, and check the <a href=\"currency.html\">currency converter</a> before you travel or invoice abroad.",
    ],
    faq: [
      ["Are these finance calculators accurate?", "They use standard formulas: the amortization formula for loans, compound interest with your chosen compounding frequency, and live mid-market exchange rates. Results are estimates for planning and do not include fees or taxes unless a tool asks for them."],
      ["Do you store my financial data?", "No. Calculations happen locally in your browser. Some tools remember your last inputs on your own device for convenience; you can clear them at any time by clearing site data."],
      ["Where do the exchange rates come from?", "The currency tools use free public exchange-rate feeds, cache them for a short time and fall back to the most recent saved rates when you are offline."],
    ],
  },
  health: {
    title: "Free Health & Fitness Calculators",
    h1: "Health & fitness calculators",
    description: "Free health calculators: BMI and ideal weight, macro and calorie targets, plus fun lifetime stats for heartbeats, steps, sleep and breaths. Private and instant.",
    intro: "Understand your body with quick, science-based calculators. Check your BMI and healthy weight range, set protein, carb and fat targets, and discover your lifetime heartbeats, steps and hours asleep.",
    body: [
      "The <a href=\"bmi.html\">BMI calculator</a> shows your Body Mass Index alongside waist-to-height ratio and an ideal weight range, while the <a href=\"macros.html\">macro calculator</a> estimates your daily energy needs and splits them into macronutrients for cutting, maintaining or bulking.",
      "These tools are for general information and are not medical advice. Talk to a qualified professional before making significant changes to your diet or exercise.",
    ],
    faq: [
      ["Is BMI a good measure of health?", "BMI is a quick screening number based on height and weight. It does not distinguish muscle from fat, so the calculator also shows waist-to-height ratio, which better reflects abdominal fat."],
      ["How are macros calculated?", "The macro calculator estimates your basal metabolic rate with the Mifflin-St Jeor equation, multiplies it by your activity level, adjusts for your goal and then splits calories into protein, carbohydrate and fat."],
      ["Is my health data private?", "Yes. Height, weight, age and other inputs are processed on your device and never sent to a server."],
    ],
  },
  productivity: {
    title: "Free Productivity Tools: Calculators, Timers & Converters",
    h1: "Productivity tools",
    description: "Free productivity tools: percentage calculator, date calculator, scientific calculator, unit converter, Pomodoro timer, Kanban board, word counter and Markdown editor.",
    intro: "Everyday tools that save minutes every day. Work out percentages and date ranges, convert units, focus with a Pomodoro timer, plan with a Kanban board and polish your writing.",
    body: [
      "The <a href=\"percentage-calculator.html\">percentage calculator</a> handles discounts, increases and percentage change, the <a href=\"date-calculator.html\">date calculator</a> counts days and business days between dates, and the <a href=\"scientific-calculator.html\">scientific calculator</a> covers trigonometry, logarithms and graphing.",
      "For deep work, pair the <a href=\"pomodoro.html\">Pomodoro timer</a> with the <a href=\"kanban-board.html\">Kanban board</a>, which saves your tasks in your browser with no account required.",
    ],
    faq: [
      ["Do I need an account to save my Kanban tasks?", "No. Tasks are saved to your browser's local storage, so they persist between visits on the same device without any sign-up."],
      ["Can I use these tools offline?", "Yes. Once you've opened a tool it is cached by the site's service worker and keeps working without a connection."],
      ["Which keyboard shortcuts are available?", "Press Ctrl+K (or ⌘K on a Mac) on any page to search and jump to a tool. Many tools add their own shortcuts, listed on the tool page."],
    ],
  },
  dev: {
    title: "Free Online Developer Tools: JSON, Base64, Hash & UUID",
    h1: "Developer tools",
    description: "Free developer tools that run locally: JSON formatter and validator, Base64 and URL encoder, JWT decoder, MD5/SHA hash generator, UUID generator and mock data generator.",
    intro: "Fast, private utilities for everyday coding. Format and validate JSON, encode and decode Base64, URLs and JWTs, generate hashes and UUIDs, and create realistic mock data.",
    body: [
      "Because everything runs in your browser, it's safe to paste API responses, tokens and config files. Nothing is logged or uploaded. The <a href=\"json-formatter.html\">JSON formatter</a> pinpoints syntax errors to the exact line and column, and the <a href=\"hash-generator.html\">hash generator</a> uses the Web Crypto API for SHA digests and HMAC.",
      "Need identifiers? The <a href=\"uuid-generator.html\">UUID generator</a> produces random v4 and time-ordered v7 UUIDs in bulk, and the <a href=\"data-generator.html\">mock data generator</a> exports seed data as JSON or CSV.",
    ],
    faq: [
      ["Is it safe to paste secrets or tokens?", "Yes. These tools don't send your input anywhere; processing happens in JavaScript on your device. You can even disconnect from the internet and they keep working."],
      ["What's the difference between UUID v4 and v7?", "UUID v4 is fully random. UUID v7 starts with a millisecond timestamp, so values sort by creation time, which makes them friendlier as database primary keys."],
      ["Does the Base64 encoder support emoji and non-Latin text?", "Yes. Text is encoded as UTF-8 before Base64 encoding, so emoji, Arabic, Chinese and other scripts round-trip correctly."],
    ],
  },
  design: {
    title: "Free Design Tools: Image Compressor, Color Palettes & QR Codes",
    h1: "Design tools",
    description: "Free design tools in your browser: compress and resize JPG, PNG and WebP images, generate color palettes with WCAG contrast checks, and create custom QR codes.",
    intro: "Quick design utilities with no uploads. Shrink images for the web, build accessible color palettes and design QR codes that match your brand.",
    body: [
      "The <a href=\"image-compressor.html\">image compressor</a> reduces file size and converts between JPG, PNG and WebP locally, which is ideal for faster websites and email attachments. The <a href=\"chroma-studio.html\">color palette studio</a> extracts colors from photos and checks text contrast against WCAG guidelines.",
      "The <a href=\"qr.html\">QR code generator</a> exports high-resolution codes in your own colors for print and screens.",
    ],
    faq: [
      ["Are my images uploaded to a server?", "No. Images are decoded, resized and re-encoded with your browser's canvas, so they never leave your device."],
      ["Which format gives the smallest images?", "WebP is usually 25–35% smaller than JPEG at similar quality and supports transparency. Use JPEG for maximum compatibility and PNG for sharp graphics or screenshots."],
      ["Do QR codes expire?", "No. The QR codes you generate are static images that encode your link or text directly, so they work forever."],
    ],
  },
  security: {
    title: "Free Password Generator & Security Tools",
    h1: "Security & privacy tools",
    description: "Free security tools: strong random password generator, password strength and crack-time checker, and steganography to hide encrypted messages in text or images.",
    intro: "Protect your accounts and your privacy. Generate strong passwords with your browser's cryptographic randomness, test how long a password would take to crack and hide secret messages in plain sight.",
    body: [
      "The <a href=\"password.html\">password generator</a> uses <code>crypto.getRandomValues</code>, the same secure random source browsers use for encryption, and the <a href=\"security-vault.html\">password strength tester</a> estimates entropy and crack time without ever transmitting what you type.",
      "For private notes, the <a href=\"decoder.html\">steganography studio</a> can hide AES-256 encrypted messages inside invisible characters or image pixels.",
    ],
    faq: [
      ["How long should my password be?", "Use at least 14–16 random characters, or a passphrase of five or more random words. Length adds far more strength than swapping letters for symbols."],
      ["Is it safe to test my real password here?", "The checker runs entirely offline in your browser and never sends what you type. That said, it's good practice to test a similar password rather than your exact one."],
      ["Should I use a password manager?", "Yes. A password manager lets you use a unique, randomly generated password for every site, which is the single most effective protection against breaches."],
    ],
  },
  life: {
    title: "Free Lifestyle Calculators: Age, Travel, Personality & More",
    h1: "Lifestyle tools",
    description: "Free lifestyle tools: exact age calculator, age difference, trip cost estimator, MBTI personality test, Rubik's cube solver, cricket NRR calculator and screen-time audit.",
    intro: "Fun, useful tools for everyday life. Find your exact age, budget your next trip, discover your personality type, solve a Rubik's cube and calculate cricket net run rate.",
    body: [
      "The <a href=\"birthday.html\">age calculator</a> counts your age down to the second with a live birthday countdown, and the <a href=\"flight.html\">trip cost estimator</a> budgets flights, hotels, food and activities in any currency.",
      "Curious about yourself? Take the <a href=\"mbti.html\">personality test</a>, or audit your phone habits with the <a href=\"social.html\">digital minimalism audit</a>.",
    ],
    faq: [
      ["Is the personality test the official MBTI?", "No. It's a free Myers-Briggs–style questionnaire inspired by the same four dimensions. It's great for self-reflection but isn't the official, certified instrument."],
      ["How does the Rubik's cube solver work?", "Enter your cube's colors on the 3D model or scan it with your camera, and the solver computes a step-by-step solution you can follow move by move."],
      ["How is cricket net run rate calculated?", "NRR is runs scored per over minus runs conceded per over across the tournament. When a team is bowled out, the full quota of overs counts, which the calculator handles automatically."],
    ],
  },
};
