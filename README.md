# Dukafiti - Offline-First Business Management App

Dukafiti is a comprehensive business management application designed for small to medium enterprises. This app works fully offline and can be packaged as a mobile app with SMS receipt capabilities.

## Features

- ✅ **Fully Offline-First**: All features work without internet connection
- ✅ **SMS Receipts**: Send SMS receipts via device SIM card (Android)
- ✅ **Live Preview**: Test on other devices during development
- ✅ **Mobile App**: Installable Android APK with native features
- ✅ **PWA Support**: Install as web app on any device
- ✅ **Data Sync**: Automatic sync when online restored

## Prerequisites

- Node.js 18+
- Android Studio (for Android development)
- Java Development Kit (JDK 17+)

## Development

### Live Preview Development

Start development server with network access:
```bash
npm run dev:network
```

This will show a network URL that you can access from other devices on the same network.

### Build for Development
```bash
npm run build:dev
```

### Preview Build
```bash
npm run preview:network
```

## Mobile App Development

### Android Development

1. **Build and open Android project:**
```bash
npm run mobile:android
```

2. **Manual Android operations:**
```bash
npm run cap:android    # Open Android Studio
npm run cap:sync       # Sync web assets
npm run cap:build      # Build and copy assets
```

### iOS Development

1. **Build and open iOS project:**
```bash
npm run mobile:ios
```

2. **Manual iOS operations:**
```bash
npm run cap:ios        # Open Xcode
npm run cap:sync       # Sync web assets
npm run cap:build      # Build and copy assets
```

## SMS Receipts Configuration

### Android Permissions

The app automatically requests SMS permissions. Users can:
1. Enable SMS receipts in Settings
2. Grant SMS permissions when prompted
3. Send receipts directly via device SIM card

### Web/Other Platforms

- Uses Web SMS API when available
- Falls back to service worker queuing
- Sends when connectivity is restored

## Offline Capabilities

### Data Storage
- **IndexedDB**: Primary offline storage
- **Service Worker**: Caching and background sync
- **Local Storage**: User preferences and settings

### Features Working Offline
- ✅ Customer management (add, edit, delete)
- ✅ Inventory management (products, stock levels)
- ✅ Sales processing (checkout, payments)
- ✅ Debt tracking and payments
- ✅ Reports and analytics
- ✅ SMS receipts (queued for sending)
- ✅ Settings and preferences

## Project Structure

```
DUKAFITI/
├── src/                 # React source code
├── public/              # Static assets and PWA files
├── android/             # Android native project
├── ios/                 # iOS native project (when added)
├── dist/                # Build output
├── capacitor.config.ts  # Capacitor configuration
└── vite.config.ts       # Vite build configuration
```

## Key Files

- `public/unified-offline-sw.js` - Service worker for offline functionality
- `src/hooks/useSMS.ts` - SMS functionality with Capacitor integration
- `capacitor.config.ts` - Mobile app configuration
- `vite.config.ts` - Build and PWA configuration

## Building for Production

### Web Build (PWA)
```bash
npm run build
```

### Android APK
1. Build web assets:
```bash
npm run build
```

2. Copy to Android project:
```bash
npx cap copy android
```

3. Open in Android Studio:
```bash
npx cap open android
```

4. Build APK in Android Studio

### iOS App
1. Build web assets:
```bash
npm run build
```

2. Copy to iOS project:
```bash
npx cap copy ios
```

3. Open in Xcode:
```bash
npx cap open ios
```

4. Build in Xcode

## Testing Offline Functionality

1. **Development Testing:**
   - Use browser dev tools to simulate offline
   - Test all CRUD operations without network
   - Verify data persistence in IndexedDB

2. **Mobile Testing:**
   - Install APK on device
   - Test in airplane mode
   - Verify SMS receipts queue and send
   - Test data sync when online restored

## Troubleshooting

### Common Issues

1. **SMS Permissions Not Working:**
   - Check AndroidManifest.xml permissions
   - Verify device SMS app permissions
   - Test with different phone numbers

2. **Offline Data Not Syncing:**
   - Check service worker registration
   - Verify IndexedDB storage
   - Test network connectivity restoration

3. **Build Errors:**
   - Run `npm run cap:sync` to refresh plugins
   - Clean and rebuild Android project
   - Check Capacitor plugin versions

### Debug Commands

```bash
# Check Capacitor status
npx cap doctor

# Update Capacitor plugins
npx cap update

# Clean and rebuild
npm run build && npx cap copy
```

## Environment Variables

Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PWA_ENABLED=true
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License

This project is licensed under the MIT License.

## Support

For issues and feature requests, please create an issue on GitHub.
