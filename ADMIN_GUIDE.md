# 🔑 EPLQ Admin Access Guide

## How to Login as Admin

### Option 1: Make Yourself Admin (First Time Setup)

1. **Register a regular account** at `/register` or login at `/login`
2. **Go to Firebase Console**:
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Select your EPLQ project (your-project-id)
   - Go to **Firestore Database**

3. **Update your user role**:
   - Find the `userProfiles` collection
   - Locate your user document (by email)
   - Edit the document
   - Change the `role` field from `"user"` to `"admin"`
   - Save the changes

4. **Access admin dashboard**:
   - Go to `/admin` or navigate to `http://localhost:5173/admin`
   - You now have full admin access!

### Option 2: Have Another Admin Promote You

1. **Login as a regular user**
2. **Ask an existing admin** to:
   - Go to `/admin` → **Role Management** tab
   - Find your user in the list
   - Click **"Make Admin"** button
   - Changes take effect immediately

## Admin Features Available

### 🔑 Role Management (`/admin` → Role Management tab)
- **View all users** with their current roles
- **Promote users to admin** or demote admins to users
- **Filter users** by role (All/Admin/User)
- **Bulk user management** capabilities
- **Protect against self-demotion** (can't remove your own admin)

### 📊 System Overview
- **User statistics** (total users, admins, regular users)
- **POI data metrics** (total encrypted POIs)
- **Query analytics** (total queries, performance stats)
- **System health monitoring**

### 📤 Data Upload
- **Upload POI data** via CSV files
- **EPLQ encryption** of all uploaded data
- **Batch processing** for large datasets
- **Real-time progress tracking**

### 👥 User Management
- **View all user profiles**
- **Monitor user activity**
- **Privacy settings overview**
- **Query history analysis**

### 🔒 Encrypted Data Viewer
- **Browse encrypted POI data**
- **Decrypt and view POI details** (admin only)
- **Data integrity verification**
- **Spatial index analysis**

### ⚙️ System Settings
- **Configure system parameters**
- **Update encryption settings**
- **Manage performance optimizations**
- **System maintenance tools**

## Admin vs User Access

| Feature | Admin Access | User Access |
|---------|-------------|-------------|
| Dashboard | `/admin` (full control) | `/dashboard` (personal only) |
| POI Upload | ✅ Bulk upload & manage | ❌ No upload access |
| User Management | ✅ View & manage all users | ❌ Own profile only |
| Role Management | ✅ Promote/demote users | ❌ No role access |
| Encrypted Data | ✅ View all encrypted POIs | ❌ Query results only |
| System Stats | ✅ Full system analytics | ❌ Personal stats only |
| POI Search | ✅ Advanced search tools | ✅ Basic search |

## Security Features

### 🛡️ Admin Protection
- **Route protection**: `/admin` routes require admin role
- **Component-level guards**: Admin components check user role
- **Self-protection**: Admins can't remove their own privileges
- **Audit logging**: All admin actions are logged

### 🔐 Privacy Preservation
- **Zero-knowledge admin access**: Admins can't see user locations without decryption
- **Encrypted data at rest**: All POI data remains encrypted
- **Query privacy**: Admin can't see user search patterns
- **Role-based permissions**: Strict separation of admin vs user capabilities

## Current Admin Users

To see who currently has admin access:
1. Go to `/admin` → **Role Management** tab
2. Filter by **"Admins"** to see all current administrators
3. Admin users have a **purple badge** and 👨‍💼 icon

## Troubleshooting

### Can't Access `/admin`?
- ✅ Check your user role in Firestore (`userProfiles` collection)
- ✅ Ensure the `role` field is exactly `"admin"` (case-sensitive)
- ✅ Try logging out and logging back in
- ✅ Clear browser cache and try again

### Role Changes Not Working?
- ✅ Verify you have admin privileges
- ✅ Check Firebase Firestore rules allow admin operations
- ✅ Ensure target user exists in `userProfiles` collection
- ✅ Check browser console for any error messages

### Performance Issues?
- ✅ Admin dashboard loads large datasets - expect some loading time
- ✅ Use filters to reduce data load when managing many users
- ✅ Refresh data periodically for latest information

---

**🎯 Quick Start**: To become an admin right now, update your user document in Firebase Firestore by changing `role: "user"` to `role: "admin"`, then visit `/admin`!
