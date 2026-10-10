
const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const subscriptionPlanSchema = new Schema({
    planName:{
        type:String,
        required:true
    },
    revenuecat_product_id:{
        type:String,
        unique:true,
        required:true
    },
    stripe_price_id:{
        type:String,
        unique:true
    },
    entitlements:[{
        type:String
    }],
    billing_period:{
        type:String,
        enum:["Monthly", "Yearly"]
    },
    amount:{
        type:Number
    },
    currency:{
        type:String,
        default:"BHD"
    },
    description:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
}, {
    timestamps:true
})

const subscriptionSchema = new Schema({

    user:{
        type:ObjectId,
        ref:"User",
        required:true
    },
    
    // RevenueCat fields
    revenuecat_customer_id:{
        type:String,
        required:true,
        unique:true
    },
    revenuecat_product_id:{
        type:String,
        required:true
    },
    revenuecat_subscription_id:{
        type:String
    },
    
    // Stripe fields
    stripe_price_id:{
        type:String
    },
    stripe_subscription_id:{
        type:String
    },
    stripe_customer_id:{
        type:String
    },
    
    // Subscription details
    plan_name:{
        type:String
    },
    billing_period:{
        type:String,
        enum:["monthly", "yearly"]
    },
    
    subscription_start_date:{
        type:Date,
    },
    subscription_end_date:{
        type:Date,
    },
    
    original_purchase_date:{
        type:Date,
    },
    
    subscription_status:{
        type:String,
        enum:["active", "inactive", "cancelled","pending", "paused", "expired"],
        default:"pending"
    },
    
    subscription_auto_renew:{
        type:Boolean,
        default:true
    },
    
    last_payment_date:{
        type:Date,
    },
    last_payment_status:{
        type:String,
        enum:["succeed", "failed", "pending"]
    },
    
    next_payment_date:{
        type:Date
    },
    
    // Trial information
    trial_start_date:{
        type:Date
    },
    trial_end_date:{
        type:Date
    },
    trial_used:{
        type:Boolean,
        default:false
    },
    
    // Active entitlements
    active_entitlements:[{
        type:String
    }],
    
    // Grace period info
    grace_period_start:{
        type:Date
    },
    grace_period_end:{
        type:Date
    },
    
    // Cancellation info
    cancellation_date:{
        type:Date
    },
    cancellation_reason:{
        type:String,
        enum:["user_cancelled", "billing_error", "pricing_change", "upgrade", "downgrade", "customer_support", "unknown"]
    },
    
    // Refund info
    refund_amount:{
        type:Number
    },
    refund_date:{
        type:Date
    },
    
    // Webhook tracking
    last_webhook_event_id:{
        type:String
    },
    
    last_webhook_date:{
        type:Date
    }

}, {
    timestamps:true
})

// Add indexes for better query performance
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ revenuecat_customer_id: 1 });
subscriptionSchema.index({ stripe_customer_id: 1 });
subscriptionSchema.index({ subscription_status: 1 });
subscriptionPlanSchema.index({ revenuecat_product_id: 1 });

const SubscriptionPlan = model("SubscriptionPlan", subscriptionPlanSchema)
const Subscription = model("Subscription", subscriptionSchema)

module.exports = {
    SubscriptionPlan,
    Subscription
}