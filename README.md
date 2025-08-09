# TweetNest

# Social Media Platform

## Overview

This project consists of a **Backend API** and a **Frontend Application** for a social media platform. Together, they provide functionalities like user authentication, post management, notifications, and user profile management.

---

## Backend: Social Media API

### Overview

The Social Media API is a RESTful service built with **Node.js** (likely using **Express.js**) to handle core backend functionalities for the platform. 

### Features

- **User Authentication**
  - Secure user registration and login with JWT-based authentication.
- **Post Management**
  - Create, read, update, and delete posts.
- **Notification System**
  - Send and manage notifications for user interactions.
- **User Management**
  - Manage user profiles, including viewing and updating user information.

---

## Frontend: Social Media Application

### Overview

The frontend application is built using **React**, **Vite**, **Tailwind CSS**, and **DaisyUI**. It provides an intuitive and responsive user interface for interacting with the platform.

### Features

- **User Authentication**
  - Secure login and signup functionality.
- **Home Page**
  - Displays a feed of posts from various users.
- **Post Creation**
  - Allows users to create and share new posts.
- **Profile Page**
  - Displays user profile information and allows for profile editing.
- **Notification Page**
  - Displays user notifications.
- **Loading Spinners**
  - Provides visual feedback during loading operations.
- **Responsive Design**
  - Fully responsive layout using Tailwind CSS.
- **Styling**
  - Leveraging DaisyUI for pre-built, customizable UI components.

---

## Technologies Used

### Backend
- **Node.js** with **Express.js** 
- **JWT** for authentication
- **MongoDB** 

### Frontend
- **React** and **Vite** for fast, modern development
- **Tailwind CSS** for responsive styling
- **DaisyUI** for UI components
- **React Router** for client-side routing
- **React Hook Form** for form validation
- **React Query** for data fetching and caching

---

## Installation and Setup

### Backend

1. Clone the repository.
   

2. Set up the environment variables.
   ```bash
   MONGO_URI=your-mongo-uri
   PORT=3000
   JWT_SECRET=your-jwt-secret
   NODE_ENV=your-node-environment
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret

3. Build the project.
   ```bash
   npm run build

4. Start the server.
   ```bash
   npm run start
