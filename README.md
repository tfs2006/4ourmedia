<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 4ourMedia PromoGen

AI-powered promotional image generator. Turn any product URL into stunning, branded 9:16 promo images ready for social media.

## Features

- 🔍 **AI Product Analysis** - Automatically researches product details from URLs
- 🎨 **AI Image Generation** - Creates custom background images via Google Gemini
- ✏️ **Live Customization** - Add your logo, adjust positioning, customize branding
- 📱 **Social-Ready** - Exports in 9:16 vertical format perfect for Instagram/TikTok
- 🔒 **Secure** - API keys stored server-side, never exposed to browsers
- 🎮 **Demo Mode** - Let users try before they buy (configurable limits)
- 💳 **Stripe Integration** - Built-in payment processing for selling licenses

---

## Quick Start (For Buyers)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A Google Gemini API key ([Get one free](https://aistudio.google.com/apikey))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Go to `http://localhost:3000`
   - Enter your Gemini API key when prompted
   - Start generating promos!

---

## Running as a Demo/Sales Site (For Sellers)

If you want to sell this app, you can run it in demo mode with Stripe payments.

### 1. Set Up Environment Variables

Create a `.env` file:

```bash
# Your Gemini API key (used for demo generations)
DEMO_API_KEY=your_gemini_api_key

# Stripe keys (from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Enable demo mode
DEMO_MODE=true
```

### 2. Configure Demo Settings

Edit `server/demo.ts` to customize:
- `maxGenerations` - Free generations before requiring purchase (default: 3)

### 3. Configure Pricing

Edit `server/stripe.ts` to customize:
- `priceInCents` - Product price (default: 4900 = $49.00)
- `name` and `description` - Product details shown at checkout

### 4. Start Demo Server

```bash
npm run dev:demo
```

### 5. Set Up Stripe Webhook

In your Stripe dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Configuration

### For Buyers (After Purchase)

On first launch, you'll see a setup wizard to enter your API key. Your key is:
- ✅ Validated before saving
- ✅ Stored locally in `config/settings.json`
- ✅ Never sent to external servers (only to Google's API)

To reconfigure, click **Settings** in the header or delete the `config/` folder.

### For Sellers (Demo Mode)

Demo usage is tracked in `config/demo-usage.json` (per session).
Licenses are stored in `config/licenses.json`.

---

## Project Structure

```
├── server/              # Backend API (Express)
│   ├── index.ts         # API routes
│   ├── config.ts        # API key configuration
│   ├── demo.ts          # Demo mode & usage tracking
│   └── stripe.ts        # Payment & license management
├── components/          # React components
│   ├── SetupWizard.tsx  # First-run API key setup
│   ├── DemoBanner.tsx   # Demo mode UI
│   └── PurchaseModal.tsx# Purchase flow
├── services/            # Frontend API client
├── config/              # Generated - API keys & licenses (gitignored)
└── dist/                # Generated - Production build
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/setup/status` | Check if app is configured |
| `POST /api/setup/configure` | Save API key |
| `GET /api/demo/status` | Get demo usage info |
| `POST /api/analyze` | Analyze product URL |
| `POST /api/generate-image` | Generate promo image |
| `POST /api/purchase/checkout` | Create Stripe checkout |
| `POST /api/purchase/verify` | Verify purchase & get license |
| `GET /api/download/:key` | Download app with license |

---

## License

MIT License - See [LICENSE](LICENSE) file.

## Support

For issues or questions, contact the developer or open an issue.
