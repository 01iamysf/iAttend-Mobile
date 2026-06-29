# iAttend Mobile

This is the mobile application client for the iAttend attendance tracking system. It is built using React Native and Expo, and connects to the iAttend backend API.

## Companion Web Application

The desktop dashboard and administrative panel are available in the web repository:

https://github.com/01iamysf/iAttend

## Getting Started

1. Install dependencies:
```sh
npm install
```

2. Configure environment variables in a `.env` file in the root directory:
```
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5000/api
```

3. Run the development server:
```sh
npx expo start -c
```
