# API Testing Guide - Auction App with RBAC

## Base URL
```
http://localhost:3000
```

## Authentication Endpoints

### 1. Register New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "password123",
  "roleName": "COLLECTOR"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 25,
    "name": "Test User",
    "email": "testuser@example.com"
  }
}
```

### 2. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "superadmin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "superadmin@example.com",
    "roles": ["SUPER_ADMIN"]
  }
}
```

### 3. Get Current User Info
```bash
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "user": {
    "userId": 1,
    "email": "superadmin@example.com",
    "roles": ["SUPER_ADMIN"]
  }
}
```

---

## ADMIN Endpoints (Admin & Super Admin Access)
**Prefix:** `/api/admin/users`

### 1. Get All Users
**Access:** ADMIN, SUPER_ADMIN

```bash
GET /api/admin/users
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "superadmin@example.com",
      "roles": ["SUPER_ADMIN"],
      "createdAt": "2025-11-30T...",
      "updatedAt": "2025-11-30T..."
    },
    ...
  ]
}
```

### 2. Get User by ID
**Access:** ADMIN, SUPER_ADMIN

```bash
GET /api/admin/users/:id
Authorization: Bearer <your-jwt-token>
```

### 3. Update User
**Access:** ADMIN, SUPER_ADMIN

```bash
PUT /api/admin/users/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

---

## SUPER ADMIN Endpoints (Super Admin Only)
**Prefix:** `/api/superadmin/users`

### 1. Delete User
**Access:** SUPER_ADMIN only

```bash
DELETE /api/superadmin/users/:id
Authorization: Bearer <your-jwt-token>
```

### 2. Assign Role to User
**Access:** SUPER_ADMIN only

```bash
POST /api/superadmin/users/:userId/roles
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "roleName": "ADMIN"
}
```

### 3. Remove Role from User
**Access:** SUPER_ADMIN only

```bash
DELETE /api/superadmin/users/:userId/roles
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "roleName": "COLLECTOR"
}
```

---

## Available Roles

- `SUPER_ADMIN` - Full access to all endpoints
- `ADMIN` - Can view and manage users (view, update)
- `ARTIST` - Basic user access
- `COLLECTOR` - Basic user access

---

## Route Structure

### Admin Routes (`/api/admin/users`)
- GET `/` - Get all users
- GET `/:id` - Get user by ID
- PUT `/:id` - Update user

### Super Admin Routes (`/api/superadmin/users`)
- DELETE `/:id` - Delete user
- POST `/:userId/roles` - Assign role
- DELETE `/:userId/roles` - Remove role

---

## Testing with cURL

### Login as Super Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "superadmin123"
  }'
```

### Get All Users (Admin endpoint)
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Delete User (SuperAdmin endpoint)
```bash
curl -X DELETE http://localhost:3000/api/superadmin/users/5 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with PowerShell

### Login as Admin
```powershell
$body = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
```

### Get All Users (Admin)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" -Method Get -Headers $headers
```

### Assign Role (SuperAdmin only)
```powershell
$headers = @{
    Authorization = "Bearer $superadmin_token"
}

$body = @{
    roleName = "ADMIN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/superadmin/users/5/roles" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions.",
  "requiredRoles": ["ADMIN", "SUPER_ADMIN"],
  "userRoles": ["COLLECTOR"]
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

---

## Test Users from Seed

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | superadmin123 | SUPER_ADMIN |
| admin@example.com | admin123 | ADMIN |
| artist@example.com | artist123 | ARTIST |
| collector@example.com | collector123 | COLLECTOR |
