# 🔐 EPLQ - Efficient Privacy-Preserving Location-based Queries

> A React-based implementation of privacy-preserving spatial queries with predicate-only encryption for secure location data processing.

[![Firebase](https://img.shields.io/badge/Firebase-12.2.0-orange?style=flat-square&logo=firebase)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-19.1.1-blue?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.1.5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

## 🌟 Overview

EPLQ (Efficient Privacy-Preserving Location-based Queries) is a cutting-edge web application that implements privacy-preserving spatial queries using predicate-only encryption. The system enables users to search for Points of Interest (POIs) while maintaining complete location privacy through advanced cryptographic techniques.

### 🔑 Key Features

- **🛡️ Privacy-Preserving Encryption**: Predicate-only encryption ensures location data remains encrypted and private
- **⚡ Efficient Spatial Queries**: Optimized geohash-based indexing for fast (~0.9s) query execution
- **🌍 Zero-Knowledge Security**: Server cannot decrypt or analyze user location data
- **👨‍💼 Admin Dashboard**: Complete management interface for POI data and user roles
- **📱 Responsive Design**: Modern brutalist UI design optimized for all devices
- **🔍 Advanced Search**: Circle-based spatial range queries with category filtering

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  EPLQ Crypto    │    │   Firebase      │
│                 │    │                 │    │                 │
│ • React UI      │◄──►│ • Encryption    │◄──►│ • Firestore DB  │
│ • POI Search    │    │ • Spatial Index │    │ • Authentication│
│ • User/Admin    │    │ • Query Engine  │    │ • Security Rules│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔐 EPLQ Encryption Flow

1. **POI Upload**: Admin uploads POI data → EPLQ encryption → Firestore storage
2. **Spatial Indexing**: Generate privacy-preserving geohash indices
3. **Query Processing**: User query → Encrypted predicate → Secure matching
4. **Result Decryption**: Client-side decryption of matching POIs only

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Firebase** project with Firestore enabled
- **Modern web browser** with ES2020 support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avishek-7/EPLQ-Privacy-Preserving-Location-Based-Queries.git
   cd EPLQ-Privacy-Preserving-Location-Based-Queries
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your Firebase configuration
   nano .env
   ```

4. **Set up Firebase project**
   ```bash
   # Login to Firebase
   firebase login
   
   # Set your project
   firebase use your-project-id
   
   # Deploy Firestore rules and indexes
   firebase deploy --only firestore
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📚 Usage Guide

### 👤 User Features

#### 🔍 POI Search
1. Navigate to `/dashboard`
2. Set your location (GPS or manual coordinates)
3. Configure search parameters (radius, category)
4. Execute privacy-preserving search
5. View encrypted results with distance calculations

#### 📍 Location Input Options
- **GPS Location**: Automatic geolocation (requires permission)
- **Preset Locations**: Quick buttons for major cities
- **Manual Coordinates**: Direct latitude/longitude input

### 👨‍💼 Admin Features

#### 🔑 Admin Access
1. **Method 1**: Update user role in Firebase Console
   ```bash
   # In Firestore Console
   Collection: userProfiles
   Document: [your-user-id]
   Field: role
   Value: "admin"
   ```

2. **Method 2**: Have existing admin promote you
   - Ask admin to go to `/admin` → Role Management
   - Find your user and click "Make Admin"

#### 📤 Data Management
- **Upload POI Data**: CSV file upload with automatic encryption
- **Sample Data**: One-click upload of test POI data
- **Clear Database**: Remove all POI data for fresh start
- **User Roles**: Promote/demote users between admin and user roles

#### 📊 System Monitoring
- **User Statistics**: Total users, admins, activity metrics
- **Query Analytics**: Search patterns and performance data
- **System Health**: Encryption status and database metrics

## 🛠️ Development

### Project Structure

```
src/
├── components/           # React components
│   ├── admin/           # Admin dashboard components
│   ├── auth/            # Authentication components
│   ├── ui/              # Reusable UI components
│   └── user/            # User interface components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Core libraries
│   ├── encryption/      # EPLQ crypto implementation
│   └── firebase.ts     # Firebase configuration
├── pages/               # Page components
├── services/            # API services
└── utils/               # Utility functions
```

### 🔧 Core Technologies

- **Frontend**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.5 with hot module replacement
- **Styling**: Tailwind CSS with custom brutalist design
- **Database**: Firebase Firestore with security rules
- **Authentication**: Firebase Auth with role-based access
- **Encryption**: Custom EPLQ implementation with Web Crypto API

### 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### 🚀 Deployment

#### Firebase Hosting
```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Deploy hosting only
firebase deploy --only hosting
```

#### Environment Setup
- **Development**: Local development server with hot reload
- **Staging**: Firebase preview channels for testing
- **Production**: Firebase Hosting with custom domain

## 🔒 Security

### Privacy Features

- **End-to-End Encryption**: POI data encrypted on client before upload
- **Zero-Knowledge Server**: Server cannot decrypt location data
- **Spatial Privacy**: Queries don't reveal exact user location
- **Role-Based Access**: Strict separation of admin and user privileges

### Firebase Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read/write their own
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Encrypted POIs - read access for authenticated users, write for admins
    match /encryptedPOIs/{poiId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 📈 Performance

### Query Optimization

- **Target Performance**: ~0.9 seconds per query execution
- **Spatial Indexing**: Geohash-based optimization for fast spatial lookups
- **Caching Strategy**: Client-side query result caching
- **Batch Processing**: Efficient batch operations for data upload/management

### Monitoring Metrics

- **Query Execution Time**: Real-time performance tracking
- **Encryption Overhead**: Crypto operation performance analysis
- **User Experience**: Response time and success rate monitoring

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Document all public APIs and functions
- Follow security best practices for crypto operations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **EPLQ Research**: Based on privacy-preserving spatial query research
- **Firebase Team**: For robust backend infrastructure
- **React Community**: For excellent developer experience
- **Tailwind CSS**: For beautiful utility-first styling

## 📞 Support

- **Documentation**: [Wiki](https://github.com/Avishek-7/EPLQ-Privacy-Preserving-Location-Based-Queries/wiki)
- **Issues**: [GitHub Issues](https://github.com/Avishek-7/EPLQ-Privacy-Preserving-Location-Based-Queries/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Avishek-7/EPLQ-Privacy-Preserving-Location-Based-Queries/discussions)

---

**🔐 Built with privacy in mind • ⚡ Optimized for performance • 🛡️ Secured by design**
