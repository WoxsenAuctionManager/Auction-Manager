# WUSA Auction Manager

A comprehensive auction management system built with Next.js and Firebase for managing player auctions, teams, and bids.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 18.0 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/WoxsenAuctionManager/Auction-Manager.git
   cd Auction-Manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:9002](http://localhost:9002) to see the application running.

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── auction/         # Auction management pages
│   │   ├── dashboard/       # Dashboard and analytics
│   │   ├── login/           # Authentication pages
│   │   ├── players/         # Player management
│   │   ├── teams/           # Team management
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Reusable UI components
│   ├── context/             # React context providers
│   ├── lib/                 # Utility libraries and Firebase config
│   └── ai/                  # AI integration files
├── docs/                    # Documentation
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server on port 9002
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🔥 Firebase Configuration

The application is pre-configured with Firebase services:

- **Authentication** - User login/signup
- **Firestore Database** - Data storage
- **Storage** - File uploads (player images, etc.)

### Firebase Services Used

- **Project ID**: `studio-2256766213-a72a9`
- **Authentication Domain**: `studio-2256766213-a72a9.firebaseapp.com`
- **Storage Bucket**: `studio-2256766213-a72a9.appspot.com`

## 🎯 Key Features

- **Auction Management** - Create and manage player auctions
- **Team Management** - Organize teams and track rosters
- **Player Database** - Comprehensive player information
- **Real-time Bidding** - Live auction updates
- **Dashboard & Analytics** - Auction insights and statistics
- **User Authentication** - Secure login system
- **Responsive Design** - Works on desktop and mobile

## 🔧 Development

### Code Quality

The project includes:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Radix UI components for accessibility

### Building for Production

```bash
npm run build
npm run start
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🚨 Troubleshooting

### Common Issues

1. **Port 9002 already in use**
   ```bash
   # Kill the process using port 9002
   lsof -ti:9002 | xargs kill -9
   # Or use a different port
   npm run dev -- -p 3000
   ```

2. **Firebase CORS Issues**
   
   If you encounter image upload issues, visit `/cors-fix` in the application for detailed instructions on fixing Firebase Storage CORS configuration.

3. **Build Errors**
   ```bash
   # Clear cache and reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **TypeScript Errors**
   ```bash
   # Run type checking
   npm run typecheck
   ```

### Getting Help

- Check the [Issues](https://github.com/WoxsenAuctionManager/Auction-Manager/issues) page
- Review Firebase documentation for authentication and database setup
- Ensure all dependencies are installed with compatible versions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This application is specifically designed for auction management and includes Firebase integration for real-time functionality. Make sure you have a stable internet connection for optimal performance.
