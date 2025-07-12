# Admin Panel Setup Guide

This guide will help you set up and configure the admin panel for your Money Manager application.

## Overview

The admin panel provides comprehensive management capabilities for your Money Manager application, including:

- **Dashboard Overview**: Key metrics and statistics
- **User Feedback Management**: View, filter, and manage user feedback
- **User Management**: Manage user accounts and permissions
- **Analytics**: App usage statistics (coming soon)
- **Settings**: Admin configuration (coming soon)

## Prerequisites

1. Firebase project configured
2. Firestore database set up
3. Authentication enabled
4. Admin user account created

## Setup Instructions

### 1. Configure Admin Access

#### Option A: Simple UID-based Admin Check

1. Open `src/app/util/guard/admin.guard.ts`
2. Replace the `adminUids` array with your actual admin user UIDs:

```typescript
private async isUserAdmin(userId: string): Promise<boolean> {
  const adminUids = [
    'your-actual-admin-uid-here', // Replace with your Firebase user UID
    // Add more admin UIDs as needed
  ];
  
  return adminUids.includes(userId);
}
```

#### Option B: Firestore-based Admin Check (Recommended)

1. Create a `users` collection in Firestore
2. Add a document for each admin user with the following structure:

```json
{
  "uid": "user-uid-here",
  "email": "admin@example.com",
  "displayName": "Admin User",
  "role": "admin",
  "isAdmin": true,
  "createdAt": "timestamp",
  "lastSignInAt": "timestamp"
}
```

3. Update the `isUserAdmin` method in `admin.guard.ts`:

```typescript
private async isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(this.firestore, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin === true || userData.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
```

### 2. Configure Firestore Security Rules

Add the following rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access rules
    match /feedback/{document} {
      allow read, write: if request.auth != null && 
        (request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.adminUids || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    match /users/{document} {
      allow read, write: if request.auth != null && 
        (request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.adminUids || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Regular user rules
    match /feedback/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. Configure Email Notifications

1. Set up EmailJS (recommended) or another email service
2. Update `src/app/util/service/email-config.ts` with your configuration:

```typescript
export const EMAIL_CONFIG = {
  serviceId: 'your-emailjs-service-id',
  templateId: 'your-emailjs-template-id',
  toEmail: 'admin@yourdomain.com',
  fromEmail: 'noreply@yourdomain.com'
};
```

### 4. Access the Admin Panel

1. Navigate to `/admin` in your application
2. Sign in with an admin account
3. You should see the admin dashboard

## Features

### Dashboard Overview

- **Total Users**: Number of registered users
- **Total Feedback**: Number of feedback submissions
- **Pending Feedback**: Number of unread feedback items
- **Active Users**: Number of users active in the last 30 days
- **Total Transactions**: Number of transactions across all users
- **Total Categories**: Number of categories created by users

### User Feedback Management

- **View All Feedback**: See all user feedback submissions
- **Filter and Search**: Filter by status, category, priority, and date range
- **Status Management**: Mark feedback as pending, reviewed, or resolved
- **Email Responses**: Send email responses directly to users
- **Export Data**: Export feedback data to CSV format
- **Delete Feedback**: Remove inappropriate or resolved feedback

### User Management

- **View All Users**: See all registered users
- **User Status**: Manage user account status (active, suspended, pending)
- **Admin Roles**: Grant or revoke admin privileges
- **User Analytics**: View user activity and usage statistics
- **Email Communication**: Send emails to users directly
- **Export User Data**: Export user data to CSV format

## Security Considerations

1. **Admin Access Control**: Only grant admin access to trusted users
2. **Firestore Rules**: Implement proper security rules to protect data
3. **Email Security**: Use secure email services and protect admin email addresses
4. **Audit Logging**: Consider implementing audit logs for admin actions
5. **Rate Limiting**: Implement rate limiting for admin operations

## Customization

### Adding New Admin Sections

1. Create a new component in `src/app/component/admin/`
2. Add the component to the admin navigation in `admin.component.ts`
3. Update the routing if needed
4. Add the component to `app.module.ts`

### Customizing Admin Dashboard

1. Modify `admin.component.ts` to add new statistics
2. Update the dashboard template in `admin.component.html`
3. Add new data loading methods to fetch custom metrics

### Styling Customization

1. Modify the SCSS files in each admin component
2. Update the theme colors and layout as needed
3. Ensure responsive design for mobile devices

## Troubleshooting

### Common Issues

1. **Admin Access Denied**: Check that the user UID is in the admin list
2. **Firestore Permission Errors**: Verify Firestore security rules
3. **Email Notifications Not Working**: Check EmailJS configuration
4. **Component Not Loading**: Ensure all components are properly imported

### Debug Mode

Enable debug logging by adding this to your environment:

```typescript
// environment.ts
export const environment = {
  production: false,
  debug: true,
  // ... other config
};
```

## Support

For additional support or questions about the admin panel:

1. Check the application logs for error messages
2. Verify all configuration settings
3. Test with a fresh admin account
4. Review Firestore security rules

## Future Enhancements

- **Advanced Analytics**: Detailed usage statistics and charts
- **Bulk Operations**: Mass user management and feedback processing
- **Automated Responses**: AI-powered feedback response suggestions
- **Integration APIs**: Connect with external services
- **Mobile Admin App**: Dedicated mobile admin interface 