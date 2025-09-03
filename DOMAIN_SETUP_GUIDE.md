# 🌐 Domain Setup Guide - Complete Step-by-Step

This guide covers how to add a custom domain to your React/Vite video chat application. The app is currently configured to work with multiple deployment platforms.

## 📋 **Current App Overview**

Your application is a **React + Vite + TypeScript** app with:
- ✅ **Supabase Backend** (database, auth, storage)
- ✅ **Socket.IO Signaling Server** (for WebRTC video calls)  
- ✅ **Stripe Integration** (payments)
- ✅ **WebRTC Video Chat** functionality
- ✅ **Production-ready** deployment configs

## 🎯 **Domain Setup Options**

### **Option 1: Lovable Platform (Recommended for beginners)**
If you're using Lovable to host your app:

1. **Access Domain Settings**
   - Open your project in [Lovable](https://lovable.dev)
   - Navigate to **Project > Settings > Domains**
   - Click **"Connect Domain"**

2. **Add Your Domain**
   - Enter your custom domain (e.g., `yourdomain.com`)
   - Follow Lovable's DNS configuration instructions
   - Wait for DNS propagation (5-60 minutes)

3. **Update Environment Variables**
   ```bash
   # In Lovable project settings, add:
   VITE_APP_URL=https://yourdomain.com
   VITE_FRONTEND_URL=https://yourdomain.com
   ```

**Reference**: [Lovable Custom Domain Guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

### **Option 2: Render Deployment**
If you're deploying to Render:

#### **Step 1: Deploy Your App to Render**
1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New" > "Web Service"**
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```yaml
   Name: your-video-chat-app
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run preview
   ```

#### **Step 2: Add Custom Domain**
1. **In Render Dashboard**
   - Go to your service settings
   - Click **"Custom Domains"**
   - Click **"Add Custom Domain"**
   - Enter your domain: `yourdomain.com`

2. **Configure DNS**
   Add these DNS records with your domain provider:
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-app-name.onrender.com
   ```

3. **Update Environment Variables**
   ```bash
   VITE_APP_URL=https://yourdomain.com
   VITE_FRONTEND_URL=https://yourdomain.com
   VITE_SIGNALING_SERVER_URL=wss://your-signaling-server.onrender.com
   ```

---

### **Option 3: Vercel Deployment**
For Vercel hosting:

#### **Step 1: Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **Step 2: Add Custom Domain**
1. **Vercel Dashboard**
   - Go to your project settings
   - Click **"Domains"**
   - Add your domain: `yourdomain.com`

2. **Configure DNS**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

3. **Environment Variables**
   ```bash
   VITE_APP_URL=https://yourdomain.com
   VITE_FRONTEND_URL=https://yourdomain.com
   ```

---

### **Option 4: Netlify Deployment**
For Netlify hosting:

#### **Step 1: Deploy to Netlify**
```bash
# Build your app
npm run build

# Deploy dist folder to Netlify via drag-and-drop or CLI
```

#### **Step 2: Add Custom Domain**
1. **Netlify Dashboard**
   - Go to **Site Settings > Domain Management**
   - Click **"Add Custom Domain"**
   - Enter: `yourdomain.com`

2. **Configure DNS**
   ```
   Type: CNAME
   Name: www
   Value: your-site-name.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   ```

---

## 🔧 **Required Configuration Updates**

### **1. Environment Variables**
Create a `.env.production` file:

```bash
# Domain Configuration
VITE_APP_URL=https://yourdomain.com
VITE_FRONTEND_URL=https://yourdomain.com

# Existing Variables (update URLs)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SIGNALING_SERVER_URL=wss://your-signaling-server.herokuapp.com

# Stripe (update webhook endpoints)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key

# TURN Servers (if using custom)
VITE_TWILIO_TURN_USERNAME=your-username
VITE_TWILIO_TURN_CREDENTIAL=your-credential
```

### **2. Update Stripe Webhooks**
If using Stripe payments, update webhook endpoints:

1. **Stripe Dashboard**
   - Go to **Developers > Webhooks**
   - Update endpoint URL: `https://yourdomain.com/api/webhooks/stripe`

### **3. Update Supabase Settings**
1. **Supabase Dashboard**
   - Go to **Authentication > URL Configuration**
   - Update **Site URL**: `https://yourdomain.com`
   - Update **Redirect URLs**: `https://yourdomain.com/auth/callback`

### **4. Update Socket.IO Server**
Update your signaling server's CORS settings:

```javascript
// In your Socket.IO server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:8080",
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    methods: ["GET", "POST"]
  }
});
```

---

## 🚀 **Deployment Checklist**

### **Before Adding Domain:**
- [ ] App is working on temporary URL (e.g., `app-name.vercel.app`)
- [ ] All environment variables are configured
- [ ] Database and authentication are working
- [ ] Payment system is tested (if applicable)

### **After Adding Domain:**
- [ ] DNS records are configured correctly
- [ ] SSL certificate is active (usually automatic)
- [ ] All API endpoints work with new domain
- [ ] WebRTC video calls function properly
- [ ] Stripe webhooks receive events (if applicable)
- [ ] Authentication flows work correctly

---

## 🔍 **Troubleshooting Common Issues**

### **Issue: "Mixed Content" Errors**
**Solution**: Ensure all resources use HTTPS
```javascript
// Update any HTTP URLs to HTTPS
const apiUrl = 'https://api.yourdomain.com' // ✅ Good
const apiUrl = 'http://api.yourdomain.com'  // ❌ Bad
```

### **Issue: CORS Errors**
**Solution**: Update server CORS settings
```javascript
// Add your domain to allowed origins
origin: ["https://yourdomain.com", "https://www.yourdomain.com"]
```

### **Issue: WebRTC Not Working**
**Solution**: Update signaling server URL
```bash
# Make sure this points to your signaling server
VITE_SIGNALING_SERVER_URL=wss://your-signaling-server.herokuapp.com
```

### **Issue: Stripe Webhooks Failing**
**Solution**: Update webhook endpoint in Stripe Dashboard
- Old: `https://temp-url.vercel.app/api/webhooks/stripe`
- New: `https://yourdomain.com/api/webhooks/stripe`

---

## 📈 **Performance Optimization with Custom Domain**

### **1. Enable CDN (Optional)**
For better performance, consider using a CDN:
```bash
# Add to environment variables
VITE_CDN_BASE_URL=https://cdn.yourdomain.com
```

### **2. Configure Caching Headers**
Update your hosting platform's caching settings:
```
Cache-Control: public, max-age=31536000  # For static assets
Cache-Control: no-cache                  # For HTML files
```

---

## 🎉 **Next Steps After Domain Setup**

1. **Test All Features**
   - User registration/login
   - Video chat functionality  
   - Payment processing (if applicable)
   - File uploads/downloads

2. **Update Documentation**
   - Update README.md with new domain
   - Update any hardcoded URLs in documentation

3. **Monitor Performance**
   - Set up analytics (Google Analytics, etc.)
   - Monitor error rates and performance metrics

4. **SEO Optimization**
   - Update meta tags with new domain
   - Submit sitemap to search engines
   - Set up Google Search Console

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the deployment platform's documentation
2. Verify DNS propagation: [DNS Checker](https://dnschecker.org)
3. Test SSL certificate: [SSL Labs](https://www.ssllabs.com/ssltest/)
4. Review browser console for specific error messages

**Your app is production-ready!** 🚀 The domain setup will give it a professional appearance and improved SEO.