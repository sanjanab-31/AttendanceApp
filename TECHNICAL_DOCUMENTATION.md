# AttendanceApp Technical Documentation

## 1. Project Overview

AttendanceApp is a role-based workforce management mobile app built with Expo + React Native.

Primary goals:

- Role-based login for Owner/Admin and Employee users
- Daily attendance and overtime capture
- Salary and bonus tracking
- Salary payment history and reporting
- Real-time data sync with Firebase Firestore

## 2. Languages and Frameworks

- TypeScript (primary app language)
- JavaScript (build/config tooling)
- React 19
- React Native 0.81
- Expo SDK 54
- Expo Router 6 (file-based routing)

## 3. Tech Stack

### Frontend / Mobile

- react-native
- expo
- expo-router
- nativewind + tailwindcss
- react-native-safe-area-context
- react-native-gesture-handler
- react-native-reanimated
- @expo/vector-icons / Ionicons

### Navigation

- expo-router (stack + tab navigation)
- @react-navigation/native (used by Expo Router)
- @react-navigation/bottom-tabs

### Backend / Data

- Firebase Authentication (email/password)
- Firebase Firestore (real-time database)

### UI/UX Utilities

- @expo-google-fonts/poppins (typography)
- @react-native-community/datetimepicker
- Custom toast and confirm dialog components

### Build / Tooling

- TypeScript
- Babel (babel-preset-expo)
- ESLint (eslint-config-expo)
- PostCSS + Tailwind
- Android native build via Gradle (expo run:android)

## 4. Runtime Architecture

The root app wraps providers in this order:

1. GestureHandlerRootView
2. SafeAreaProvider
3. AuthProvider
4. DataProvider
5. ThemeProvider
6. ToastProvider
7. Router Stack (auth/owner/employee groups)

Core root file:

- app/\_layout.tsx

## 5. Routing and Navigation Structure

The app uses route groups for role separation:

- /(auth): login
- /(owner): owner stack + owner tabs + modal screens
- /(employee): employee stack + employee tabs

Guarding pattern:

- Declarative redirects based on auth and role from AuthContext
- Root index and group layouts route users to proper destination

## 6. Authentication and Role Resolution

Auth flow:

- Email/password login using Firebase Auth
- User profile lookup in Firestore collections:
  - users (owner/admin profiles)
  - employees (employee profiles)
- Role is validated against selected login mode (Owner vs Employee)

Persistence:

- Firebase Auth initialized with AsyncStorage persistence when available

## 7. Data Model (Firestore Collections)

### users

- Owner/admin account profile data

### employees

- Employee profile (name, email, employeeId, hourlyRate, role, etc.)

### attendance

- Daily attendance per employee
- Stores date, shift hours, OT hours, salary values, dateKey
- Upsert behavior by employee + date (prevents duplicate same-day entries)

### bonuses

- Bonus records linked to employees with period range

### salaryPayments

- Salary payment records with date range and payment status

## 8. Business Logic Rules

### Salary

- Shift Salary = Shift Hours x Hourly Rate
- OT Salary = OT Hours x Hourly Rate
- Total Salary = Shift Salary + OT Salary

### Bonus basis

- Bonus uses total shift hours only
- Overtime hours are excluded from bonus calculation

### Data integrity

- Salary payment ranges are validated to avoid overlapping paid periods
- Attendance save uses created/updated result semantics

## 9. Feature Inventory

### Auth Module

- Role switch on login screen (Owner / Employee)
- Form validation for email/password
- Role mismatch sign-in prevention
- Toast feedback for success/failure

### Owner Features

Tabs:

- Dashboard
- Employees
- Attendance
- Salary
- Reports

Additional owner screens:

- Add Employee
- Edit Employee
- Mark Attendance
- Bonus Management
- Salary Payments
- Employee detail/history view

### Employee Features

Tabs:

- Dashboard
- Attendance
- Salary
- Bonus
- Profile

## 10. State Management Strategy

No Redux/MobX; app uses React Context providers:

- AuthContext: user session + role derivation + logout
- DataContext: Firestore listeners + CRUD operations
- ToastContext: global animated feedback notifications

This keeps app state centralized and reactive while staying lightweight.

## 11. UI/Design System Notes

- NativeWind utility classes for rapid styling
- Mixed style approach: className + inline style objects
- Poppins font family integration
- Safe area handling via custom SafeArea component wrappers
- Animated toast notifications and confirmation dialogs

## 12. Platform and Build Targets

- Android package: com.attendanceapp
- iOS supported (tablet enabled)
- Web static output enabled in Expo config
- New architecture enabled in app.json

## 13. Key Scripts

- npm run start -> expo start
- npm run android -> expo run:android
- npm run ios -> expo run:ios
- npm run web -> expo start --web
- npm run lint -> expo lint

## 14. Important Technical Notes

- Project uses Expo prebuild/native workflow for device builds
- For physical Android device builds, ADB device authorization must be granted
- Native build caches under android/app/.cxx and android/app/build may need cleanup if CMake/autolinking paths become stale

## 15. Repository Structure (High-Level)

- app/: all routed screens (auth/owner/employee)
- src/config/: Firebase and platform config
- src/context/: Auth, Data, Toast providers
- src/utils/: salary helpers
- components/: reusable UI and navigation components
- android/: generated native Android project

## 16. Suggested Next Documentation Additions

- API/Firestore field schema contract per collection
- Role-based access matrix by screen/action
- Error code catalog for login/data operations
- Deployment and release checklist
