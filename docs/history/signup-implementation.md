# Signup Page Implementation

## Overview
This document describes the implementation of the user registration/signup functionality for the Daadaar platform.

## Files Created

### 1. Frontend Pages
- **`/app/[locale]/signup/page.tsx`**: Main signup page component
- **`/app/[locale]/register/page.tsx`**: Redirect page for backward compatibility

### 2. Translation Updates
- **`/messages/en.json`**: Added English translations for signup form
- **`/messages/fa.json`**: Added Persian translations for signup form

## Features

### Form Fields
1. **Email** (required)
   - Email format validation
   - Real-time error feedback
   
2. **Username** (required)
   - 3-50 characters
   - Alphanumeric and underscores only
   - Real-time validation
   
3. **Display Name** (optional)
   - Defaults to username if not provided
   - Shown in UI instead of username
   
4. **Password** (required)
   - Minimum 8 characters
   - Secure input field
   
5. **Confirm Password** (required)
   - Must match password field
   - Real-time validation

### Validation

#### Client-Side Validation
- Email format validation using regex
- Username format validation (alphanumeric + underscores, 3-50 chars)
- Password minimum length (8 characters)
- Password confirmation matching
- Real-time error clearing when user corrects input

#### Server-Side Validation
The backend (`/backend/src/controllers/auth.ts`) performs additional validation:
- Email format validation
- Username format validation
- Password strength validation
- Duplicate user detection (email or username)
- Password hashing with bcrypt (cost factor 10)

### Security Features
1. **Password Hashing**: Bcrypt with cost factor 10
2. **JWT Authentication**: 30-day token expiration
3. **HttpOnly Cookies**: Secure token storage
4. **CSRF Protection**: Integrated with existing CSRF middleware
5. **Input Sanitization**: All inputs validated on both client and server

### User Flow
1. User navigates to `/signup` or `/register`
2. Fills out registration form
3. Client-side validation provides immediate feedback
4. On submit, data sent to `POST /api/auth/register`
5. Server validates, creates user account with `isVerified: false`
6. Verification email is sent to the provided address
7. User is redirected to `/login` with a message to check their email
8. User clicks link in email -> `GET /api/auth/verify-email?token=...`
9. Account is verified (`isVerified: true`)
10. User can now log in

### Error Handling
- **Validation Errors**: Displayed inline below each field
- **Server Errors**: Displayed in alert banner at top of form
- **Duplicate User**: Specific error message for existing email/username
- **Network Errors**: Generic error message with retry capability

### Design
- Matches existing login page aesthetic
- Uses `liquid-glass` effect for premium look
- Responsive design (mobile-friendly)
- Smooth transitions and animations
- Bilingual support (English and Persian)

## API Integration

### Signup Endpoint
```
POST /api/auth/register
```

### Request Body
```typescript
{
  email: string;
  username: string;
  password: string;
  displayName?: string;
}
```

### Response (Success)
```typescript
{
  success: true;
  data: {
    message: string; // "Registration successful. Please check your email to verify your account."
  }
}
```

### Verification Endpoint
```
GET /api/auth/verify-email
```

### Query Parameters
- `token`: string (The verification token sent via email)

### Response
- Redirects to `/login?verified=true` on success
- Redirects to `/login?error=verification_failed` on failure

## Translation Keys Added

### English (`en.json`)
- `signup_title`: "Join Daadaar"
- `signup_subtitle`: "Create your account to contribute to transparency"
- `signup_button`: "Create Account"
- `login_link`: "Already have an account? Login"
- `username_label`: "Username"
- `email_only_label`: "Email"
- `display_name_label`: "Display Name"
- `confirm_password_label`: "Confirm Password"
- `signup_success`: "Account created successfully"
- `signup_failed`: "Registration failed"
- `check_email_verification`: "Please check your email to verify your account."
- `email_verified`: "Email verified successfully. You can now login."
- `verification_failed`: "Email verification failed or token expired."
- `email_required`: "Email is required"
- `email_invalid`: "Invalid email format"
- `username_required`: "Username is required"
- `username_invalid`: "Username must be 3-50 characters, alphanumeric and underscores only"
- `password_required`: "Password is required"
- `password_min_length`: "Password must be at least 8 characters"
- `password_mismatch`: "Passwords do not match"
- `user_already_exists`: "User with this email or username already exists"
- `creating_account`: "Creating account..."

### Persian (`fa.json`)
- Corresponding Persian translations for all above keys

## Testing

### Manual Testing Checklist
- [ ] Form displays correctly on desktop
- [ ] Form displays correctly on mobile
- [ ] Email validation works
- [ ] Username validation works
- [ ] Password validation works
- [ ] Confirm password validation works
- [ ] Display name is optional
- [ ] Successful registration shows "Check Email" message
- [ ] Email is received with verification link
- [ ] Clicking link verifies account
- [ ] Login works only after verification (if enforced) or Login works generally
- [ ] Duplicate email shows error
- [ ] Duplicate username shows error
- [ ] Invalid credentials show appropriate errors
- [ ] Link to login page works
- [ ] Persian translations display correctly
- [ ] English translations display correctly

### Integration Testing
- [ ] User can register
- [ ] Verification token generates in DB
- [ ] Email mock/service receives request
- [ ] Verify endpoint updates `isVerified` status
- [ ] User cannot login before verification (if applicable)

## Routes

### Primary Route
- `/signup` - Main signup page

### Compatibility Route
- `/register` - Redirects to `/signup`

### Related Routes
- `/login` - Login page (links to signup)
- `/` - Home page (redirect after successful login)

## Future Enhancements

### Potential Improvements
1. **Password Strength Indicator**: Visual feedback for password strength
2. **OAuth Registration**: Sign up with Google/GitHub
3. **Username Availability Check**: Real-time check during typing
4. **Terms of Service**: Checkbox to accept ToS before registration
5. **CAPTCHA**: Add bot protection for public instances
6. **Profile Picture Upload**: Allow users to upload avatar during signup

### Security Enhancements
1. **Rate Limiting**: Prevent brute force registration attempts
2. **Email Domain Validation**: Block disposable email services
3. **Password Complexity Rules**: Require special characters, numbers, etc.
4. **Account Recovery**: Password reset functionality

## Notes

- The signup page uses the same design system as the login page
- All validation messages are translatable
- The form provides real-time feedback to improve UX
- Backend validation ensures security even if client-side is bypassed
- The implementation follows the existing authentication architecture
