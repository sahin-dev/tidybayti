# Subscription Features - Complete API Testing Guide

## Prerequisites

- Postman or similar API testing tool
- RevenueCat account with API keys
- JWT token for authenticated requests
- MongoDB database running

## Environment Setup in Postman

1. Create a new Postman Environment:
   - `base_url`: http://localhost:5000
   - `auth_token`: Your JWT token here
   - `plan_id`: MongoDB plan ID
   - `user_id`: User ID
   - `revenuecat_customer_id`: RevenueCat customer ID

## Test Cases

### 1. Public Endpoints (No Authentication)

#### 1.1 Get All Subscription Plans
```
Request:
GET {{base_url}}/subscription/plans

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "_id": "60d5ec49f5c4a500f8c0d1a1",
      "planName": "Premium",
      "revenuecat_product_id": "premium_monthly",
      "stripe_price_id": "price_1234",
      "entitlements": ["advanced_recipes", "meal_planning"],
      "billing_period": "Monthly",
      "amount": 9.99,
      "currency": "BHD",
      "description": "Premium plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 1.2 Get Specific Plan Details
```
Request:
GET {{base_url}}/subscription/plans/{{plan_id}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Plan details retrieved successfully",
  "data": {
    "_id": "60d5ec49f5c4a500f8c0d1a1",
    "planName": "Premium",
    "revenuecat_product_id": "premium_monthly",
    "entitlements": ["advanced_recipes", "meal_planning"],
    "amount": 9.99,
    "currency": "BHD"
  }
}
```

### 2. User Subscription Endpoints (Requires Authentication)

#### 2.1 Create Subscription
```
Request:
POST {{base_url}}/subscription/create
Headers:
  Authorization: Bearer {{auth_token}}
  Content-Type: application/json
Body:
{
  "planId": "{{plan_id}}",
  "stripeToken": "tok_visa_1234567890"
}

Response (201):
{
  "statusCode": 201,
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "60d5ec49f5c4a500f8c0d1a2",
    "user": "60d5ec49f5c4a500f8c0d123",
    "revenuecat_customer_id": "rc_cust_123",
    "revenuecat_product_id": "premium_monthly",
    "plan_name": "Premium",
    "subscription_status": "pending",
    "active_entitlements": ["advanced_recipes", "meal_planning"],
    "trial_used": false
  }
}
```

**Error Cases:**
- 404: Plan not found
- 409: User already has active subscription
- 400: Invalid stripe token

#### 2.2 Get Active Subscription
```
Request:
GET {{base_url}}/subscription/active
Headers:
  Authorization: Bearer {{auth_token}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Active subscription retrieved successfully",
  "data": {
    "_id": "60d5ec49f5c4a500f8c0d1a2",
    "plan_name": "Premium",
    "subscription_status": "active",
    "subscription_start_date": "2024-01-01T00:00:00.000Z",
    "subscription_end_date": "2024-02-01T00:00:00.000Z",
    "next_payment_date": "2024-02-01T00:00:00.000Z",
    "active_entitlements": ["advanced_recipes", "meal_planning"]
  }
}
```

**Error Cases:**
- 404: No active subscription found

#### 2.3 Get Subscription History
```
Request:
GET {{base_url}}/subscription/history
Headers:
  Authorization: Bearer {{auth_token}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription history retrieved successfully",
  "data": [
    {
      "_id": "60d5ec49f5c4a500f8c0d1a2",
      "plan_name": "Premium",
      "subscription_status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "60d5ec49f5c4a500f8c0d1a3",
      "plan_name": "Basic",
      "subscription_status": "cancelled",
      "createdAt": "2023-12-01T00:00:00.000Z"
    }
  ]
}
```

#### 2.4 Cancel Subscription
```
Request:
POST {{base_url}}/subscription/cancel
Headers:
  Authorization: Bearer {{auth_token}}
  Content-Type: application/json
Body:
{
  "reason": "user_cancelled"
}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription_status": "cancelled",
    "cancellation_date": "2024-01-15T10:30:00.000Z",
    "cancellation_reason": "user_cancelled"
  }
}
```

**Cancellation Reasons:**
- `user_cancelled`
- `billing_error`
- `pricing_change`
- `upgrade`
- `downgrade`
- `customer_support`
- `unknown`

#### 2.5 Pause Subscription
```
Request:
POST {{base_url}}/subscription/pause
Headers:
  Authorization: Bearer {{auth_token}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription paused successfully",
  "data": {
    "subscription_status": "paused"
  }
}
```

#### 2.6 Resume Subscription
```
Request:
POST {{base_url}}/subscription/resume
Headers:
  Authorization: Bearer {{auth_token}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription resumed successfully",
  "data": {
    "subscription_status": "active"
  }
}
```

#### 2.7 Upgrade/Downgrade Plan
```
Request:
POST {{base_url}}/subscription/upgrade-downgrade
Headers:
  Authorization: Bearer {{auth_token}}
  Content-Type: application/json
Body:
{
  "newPlanId": "new_plan_id_here"
}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription plan updated successfully",
  "data": {
    "plan_name": "Pro",
    "active_entitlements": ["advanced_recipes", "meal_planning", "priority_support"]
  }
}
```

#### 2.8 Check Entitlements
```
Request:
GET {{base_url}}/subscription/check-entitlements
Headers:
  Authorization: Bearer {{auth_token}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Entitlements checked successfully",
  "data": {
    "hasAccess": true,
    "entitlements": ["advanced_recipes", "meal_planning", "grocery_integration"],
    "planName": "Premium",
    "subscriptionStatus": "active",
    "expiresAt": "2024-02-01T00:00:00.000Z"
  }
}
```

### 3. Admin Endpoints (Requires Admin Authentication)

#### 3.1 Get Subscription Statistics
```
Request:
GET {{base_url}}/subscription/stats
Headers:
  Authorization: Bearer {{admin_auth_token}}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription statistics retrieved successfully",
  "data": {
    "total_subscriptions": 150,
    "active_subscriptions": 120,
    "cancelled_subscriptions": 20,
    "paused_subscriptions": 5,
    "expired_subscriptions": 3,
    "pending_subscriptions": 2
  }
}
```

#### 3.2 Create New Subscription Plan
```
Request:
POST {{base_url}}/subscription/admin/plans/create
Headers:
  Authorization: Bearer {{admin_auth_token}}
  Content-Type: application/json
Body:
{
  "planName": "Enterprise",
  "revenuecat_product_id": "enterprise_yearly",
  "stripe_price_id": "price_enterprise_001",
  "entitlements": ["advanced_recipes", "meal_planning", "grocery_integration", "priority_support", "custom_diets"],
  "billing_period": "Yearly",
  "amount": 299.99,
  "currency": "BHD",
  "description": "Enterprise plan with all features and priority support"
}

Response (201):
{
  "statusCode": 201,
  "success": true,
  "message": "Subscription plan created successfully",
  "data": {
    "_id": "60d5ec49f5c4a500f8c0d1a4",
    "planName": "Enterprise",
    "revenuecat_product_id": "enterprise_yearly",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Cases:**
- 409: Plan already exists
- 400: Missing required fields

#### 3.3 Update Subscription Plan
```
Request:
PUT {{base_url}}/subscription/admin/plans/{{plan_id}}
Headers:
  Authorization: Bearer {{admin_auth_token}}
  Content-Type: application/json
Body:
{
  "planName": "Premium Plus",
  "entitlements": ["advanced_recipes", "meal_planning", "grocery_integration", "nutrition_tracker"],
  "billing_period": "Monthly",
  "amount": 12.99,
  "currency": "BHD",
  "description": "Updated premium plan with nutrition tracker",
  "isActive": true
}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Subscription plan updated successfully",
  "data": {
    "_id": "60d5ec49f5c4a500f8c0d1a1",
    "planName": "Premium Plus",
    "amount": 12.99,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Webhook Endpoints

#### 4.1 Webhook Health Check
```
Request:
GET {{base_url}}/subscription/webhook/health

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Webhook endpoint is healthy",
  "data": {
    "status": "operational",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 4.2 RevenueCat Webhook
```
Request:
POST {{base_url}}/subscription/webhook/revenuecat
Headers:
  X-RevenueCat-Signature: base64_encoded_signature_here
  Content-Type: application/json
Body:
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "data": {
      "event_id": "evt_123456",
      "subscriber": {
        "app_user_id": "user_123",
        "original_purchase_date": "2024-01-15T00:00:00Z",
        "expiration_date": "2024-02-15T00:00:00Z"
      }
    }
  }
}

Response (200):
{
  "statusCode": 200,
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "eventType": "INITIAL_PURCHASE",
    "processed": true
  }
}
```

**Supported Event Types:**
- `INITIAL_PURCHASE` - New subscription
- `RENEWAL` - Subscription renewed
- `EXPIRATION` - Subscription expired
- `CANCELLATION` - User cancelled
- `BILLING_ISSUE` - Payment failed
- `REFUND` - Refund issued
- `TRANSFER` - Subscription transferred

## Integration Test Scenarios

### Scenario 1: Complete Subscription Lifecycle

```
1. Get available plans
   GET /subscription/plans
   ✓ Verify plans returned

2. Create subscription
   POST /subscription/create
   ✓ Verify subscription created with pending status

3. Simulate INITIAL_PURCHASE webhook
   POST /subscription/webhook/revenuecat
   ✓ Verify subscription status changed to active

4. Get active subscription
   GET /subscription/active
   ✓ Verify subscription is active

5. Check entitlements
   GET /subscription/check-entitlements
   ✓ Verify hasAccess is true

6. Upgrade plan
   POST /subscription/upgrade-downgrade
   ✓ Verify new plan applied

7. Pause subscription
   POST /subscription/pause
   ✓ Verify status is paused

8. Resume subscription
   POST /subscription/resume
   ✓ Verify status is active

9. Cancel subscription
   POST /subscription/cancel
   ✓ Verify status is cancelled
```

### Scenario 2: Trial to Paid Conversion

```
1. Create trial subscription
   POST /subscription/create (with free plan)
   ✓ Verify trial_used = false

2. Wait for trial period

3. Upgrade to paid plan
   POST /subscription/upgrade-downgrade
   ✓ Verify trial_used = true

4. Simulate RENEWAL webhook
   POST /subscription/webhook/revenuecat (RENEWAL event)
   ✓ Verify next payment date updated
```

### Scenario 3: Failed Payment Recovery

```
1. Create subscription
   POST /subscription/create
   ✓ Subscription active

2. Simulate BILLING_ISSUE webhook
   POST /subscription/webhook/revenuecat (BILLING_ISSUE event)
   ✓ Verify status changed to inactive

3. Get subscription
   GET /subscription/active
   ✓ Verify last_payment_status = failed

4. Simulate RENEWAL webhook (payment recovered)
   POST /subscription/webhook/revenuecat (RENEWAL event)
   ✓ Verify status changed back to active
```

## Performance Testing

### Load Test: Create Multiple Subscriptions
```javascript
// Use Apache JMeter or k6
// Test: Create 1000 subscriptions concurrently
// Measure: Response time, error rate, database impact
```

### Webhook Load Test
```javascript
// Simulate 100 webhook events per second
// Verify webhook processing queue handling
// Check database performance under load
```

## Error Scenarios to Test

```
1. Missing required fields
   Expected: 400 Bad Request

2. Invalid plan ID
   Expected: 404 Not Found

3. Duplicate subscription
   Expected: 409 Conflict

4. Expired JWT token
   Expected: 401 Unauthorized

5. Insufficient permissions
   Expected: 403 Forbidden

6. Invalid webhook signature
   Expected: 401 Unauthorized

7. Database connection error
   Expected: 500 Internal Server Error

8. RevenueCat API error
   Expected: 503 Service Unavailable
```

## Response Code Reference

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

## Debugging Tips

1. **Check logs** - Look in `/logs/winston/` for detailed error messages
2. **Verify database** - Use MongoDB Compass to inspect documents
3. **Test webhook** - Use webhook.site to capture and inspect webhook payloads
4. **Enable verbose logging** - Set `DEBUG=*` in environment
5. **Use Postman console** - View request/response details

## Performance Metrics to Monitor

- API response time (target: <200ms)
- Webhook processing time (target: <5s)
- Database query time (target: <100ms)
- Concurrent users supported (target: >1000)
- Error rate (target: <0.1%)
