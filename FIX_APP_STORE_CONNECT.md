# Fix App Store Connect Privacy Settings - Step by Step

## 🚨 Current Problem

Your **Name** data type is listed under **"Data Used to Track You"** and marked as **"Used for tracking purposes"**. This is why Apple requires ATT.

## ✅ What You Need to Do

### Step 1: Remove Name from Tracking

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **Your App → App Privacy**
3. Find the section: **"Data Used to Track You"**
4. Click on **"Contact Info"** (or the Name entry)
5. **Uncheck "Used for tracking purposes"**
6. **Remove it from the "Data Used to Track You" section entirely**

### Step 2: Update Name Settings

1. Go to **"Data Linked to You"** section
2. Click on **"Name"** under Contact Info
3. Make sure these settings are correct:
   - ✅ **"Used for App Functionality"** → Checked
   - ✅ **"Linked to the user's identity"** → Checked
   - ❌ **"Used for tracking purposes"** → **UNCHECKED** (This is critical!)

### Step 3: Update Email Address

1. Click on **"Email Address"** under Contact Info
2. Check the settings:
   - ✅ **"Used for App Functionality"** → Checked
   - ✅ **"Linked to the user's identity"** → Checked
   - ❌ **"Used for tracking purposes"** → **UNCHECKED**
3. For **"Other Purposes"** - Click to see what it says:
   - If it says "Tracking" → **Remove it**
   - If it's something else (like "Account Management") → That's fine, keep it

### Step 4: Update Phone Number

1. Click on **"Phone Number"** under Contact Info
2. Check the settings:
   - ✅ **"Used for App Functionality"** → Checked
   - ✅ **"Linked to the user's identity"** → Checked
   - ❌ **"Used for tracking purposes"** → **UNCHECKED**
3. For **"Other Purposes"** - Make sure it's NOT "Tracking"

### Step 5: Update Physical Address

1. Click on **"Physical Address"** under Contact Info
2. Check the settings:
   - ✅ **"Used for App Functionality"** → Checked
   - ✅ **"Linked to the user's identity"** → Checked
   - ❌ **"Used for tracking purposes"** → **UNCHECKED**
3. For **"Other Purposes"** - Make sure it's NOT "Tracking"

### Step 6: Update Location Settings

Your Location is currently in **"Data Not Linked to You"** which is fine, but let's verify:

1. Click on **"Precise Location"**
2. Check:

   - ✅ **"Used for App Functionality"** → Checked
   - ❌ **"Used for tracking purposes"** → **UNCHECKED**
   - For **"Other Purposes"** - Make sure it's NOT "Tracking"
   - **"Linked to the user's identity"** → Can be Yes or No (both are fine for location)

3. Click on **"Coarse Location"**
4. Same checks as above

### Step 7: Final Verification

After making all changes, your privacy settings should look like this:

**✅ "Data Used to Track You"**

- Should be **EMPTY** or show **"No data collected"**

**✅ "Data Linked to You"**

- Contact Info: Name, Email Address, Phone Number, Physical Address
- All marked as: "Used for App Functionality" + "Linked to identity"
- **NONE marked as "Used for tracking purposes"**

**✅ "Data Not Linked to You"**

- Location (Precise & Coarse)
- Marked as: "Used for App Functionality"
- **NOT marked as "Used for tracking purposes"**

## 📝 Quick Checklist

Before saving, verify:

- [ ] **"Data Used to Track You"** section is empty or shows "No data collected"
- [ ] **Name** is NOT in the tracking section
- [ ] **Name** has "Used for tracking purposes" **UNCHECKED**
- [ ] **Email Address** has "Used for tracking purposes" **UNCHECKED**
- [ ] **Phone Number** has "Used for tracking purposes" **UNCHECKED**
- [ ] **Physical Address** has "Used for tracking purposes" **UNCHECKED**
- [ ] **Precise Location** has "Used for tracking purposes" **UNCHECKED**
- [ ] **Coarse Location** has "Used for tracking purposes" **UNCHECKED**
- [ ] All "Other Purposes" do NOT include "Tracking"

## 💾 Save and Submit

1. Click **"Save"** or **"Done"** in App Store Connect
2. The changes will be published with your next app submission
3. When you resubmit your app, Apple will see that you don't track users
4. The ATT requirement will be removed

## 📋 What to Write in Review Notes

When resubmitting, include this in Review Notes:

```
Privacy Settings Update:

We have corrected our App Privacy settings. We do NOT track users across apps or websites.

- Name: Used only for App Functionality (user accounts), NOT for tracking
- Email: Used only for App Functionality (user accounts), NOT for tracking
- Location: Used only for App Functionality (prayer times, nearby mosques), NOT for tracking

All data is collected with user permission and used solely for core app features. No data is shared with advertisers or data brokers. The "Data Used to Track You" section has been updated to reflect that we do not track users.
```

## ⚠️ Important Notes

- **"Other Purposes"** is fine if it's something like "Account Management" or "Customer Support"
- **"Other Purposes"** is NOT fine if it says "Tracking" or "Advertising"
- Location can be "Linked to identity" or "Not linked" - both are fine, as long as it's not for tracking
- The key is: **Nothing should be marked as "Used for tracking purposes"**
