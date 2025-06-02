# VistAI Production Deployment Checklist

## 🔐 Prerequisites

### Cloudflare Account Setup
- [ ] Create Cloudflare account
- [ ] Get API token with appropriate permissions
- [ ] Get Account ID from Cloudflare dashboard

### Domain Setup
- [ ] Register domain or configure subdomain
- [ ] Add domain to Cloudflare (if using custom domain)
- [ ] Configure DNS settings

## 📊 Database Setup

### Cloudflare D1 Database
```bash
# Create production database
wrangler d1 create vistai-prod

# Note the database ID and update wrangler.toml
# Run migrations
wrangler d1 migrations apply vistai-prod --env production
```

- [ ] Create D1 database for production
- [ ] Update `database_id` in wrangler.toml
- [ ] Apply database migrations
- [ ] Verify database connectivity

## 🔑 Secrets Management

### Required Environment Variables
```bash
# Set OpenRouter API key
wrangler secret put OPENROUTER_API_KEY --env production

# Set JWT secret (generate a strong random string)
wrangler secret put JWT_SECRET --env production

# Set CORS origins for production
wrangler secret put ACCESS_CONTROL_ALLOW_ORIGIN --env production
# Example: "https://yourdomain.com,https://www.yourdomain.com"
```

- [ ] Set `OPENROUTER_API_KEY` secret
- [ ] Generate and set strong `JWT_SECRET` (32+ random characters)
- [ ] Configure `ACCESS_CONTROL_ALLOW_ORIGIN` for your domain

### Rate Limiting Setup
```bash
# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMITER" --env production

# Update wrangler.toml with the returned namespace ID
```

- [ ] Create KV namespace for rate limiting
- [ ] Update KV namespace IDs in wrangler.toml

## 🚀 Deployment

### Worker Deployment
```bash
# Deploy worker to production
wrangler deploy --env production
```

- [ ] Deploy Cloudflare Worker
- [ ] Verify worker endpoints are accessible
- [ ] Test API endpoints: `/api/status`, `/api/search`

### Frontend Deployment

#### Option A: Cloudflare Pages (Recommended)
```bash
# Create Cloudflare Pages project
wrangler pages project create vistai

# Deploy via GitHub Actions (automatic)
# OR manual deployment:
npm run build
wrangler pages deploy dist/public --project-name vistai
```

#### Option B: GitHub Pages
- [ ] Enable GitHub Pages in repository settings
- [ ] Configure GitHub Pages source to GitHub Actions
- [ ] Set `GITHUB_PAGES` environment variable to `true`

- [ ] Deploy frontend to Cloudflare Pages or GitHub Pages
- [ ] Configure custom domain (if using)
- [ ] Verify SSL certificate is active

## 🔒 Security Configuration

### SSL/HTTPS
- [ ] Verify SSL certificate is active and valid
- [ ] Test HTTPS redirects work correctly
- [ ] Ensure all API calls use HTTPS

### Security Headers
- [ ] Verify security headers are present in responses
- [ ] Test Content Security Policy doesn't break functionality
- [ ] Check for XSS and injection vulnerabilities

### Rate Limiting
- [ ] Test rate limiting with excessive requests
- [ ] Verify rate limits are appropriate for expected usage
- [ ] Monitor rate limiting effectiveness

## 🎯 Configuration Updates

### Update URLs and Domains
- [ ] Update meta tags in `index.html` with production URLs
- [ ] Update CORS origins in worker configuration
- [ ] Update API base URLs in frontend configuration

### Privacy and Legal
- [ ] Review and update Privacy Policy with actual contact information
- [ ] Review and update Terms of Service with your jurisdiction
- [ ] Add legal document links to footer/header
- [ ] Ensure GDPR compliance features are working

## 📊 Monitoring and Analytics

### Error Monitoring
- [ ] Set up error tracking (Sentry, LogFlare, or Cloudflare Analytics)
- [ ] Configure alert thresholds for error rates
- [ ] Test error reporting and alerting

### Performance Monitoring
- [ ] Enable Cloudflare Analytics
- [ ] Set up performance monitoring dashboards
- [ ] Configure alerts for response time thresholds

### Business Metrics
- [ ] Verify search analytics are being collected
- [ ] Test model performance tracking
- [ ] Set up business intelligence dashboards

## 🧪 Testing

### Functionality Testing
- [ ] Test user registration and login
- [ ] Test search functionality with multiple models
- [ ] Test all API endpoints in production
- [ ] Verify database operations work correctly

### Performance Testing
- [ ] Test search response times
- [ ] Verify parallel API calls are working
- [ ] Test with concurrent users
- [ ] Check bundle sizes and loading performance

### Security Testing
- [ ] Test authentication and authorization
- [ ] Verify rate limiting works as expected
- [ ] Test input validation and sanitization
- [ ] Run security scanning tools

### Cross-Browser Testing
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile devices (iOS, Android)
- [ ] Verify responsive design works across devices

## 📝 Documentation Updates

### User-Facing Documentation
- [ ] Update README with production URLs
- [ ] Create user onboarding guide
- [ ] Document API usage and limits

### Technical Documentation
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document monitoring and alerting setup

## 🎉 Go-Live Checklist

### Final Pre-Launch
- [ ] All tests passing in production environment
- [ ] SSL certificate valid and HTTPS working
- [ ] All secrets and environment variables configured
- [ ] Legal documents reviewed and published
- [ ] Monitoring and alerting configured

### Launch Day
- [ ] Deploy latest version to production
- [ ] Monitor error rates and performance
- [ ] Verify all functionality works as expected
- [ ] Announce launch (social media, etc.)

### Post-Launch
- [ ] Monitor usage patterns and performance
- [ ] Collect user feedback
- [ ] Plan iterative improvements
- [ ] Set up regular backup procedures

## 🔧 Troubleshooting Common Issues

### Worker Issues
- **500 errors**: Check worker logs in Cloudflare dashboard
- **Database errors**: Verify D1 database configuration and migrations
- **Rate limiting issues**: Check KV namespace configuration

### Frontend Issues
- **Build failures**: Check Node.js version and dependencies
- **CORS errors**: Verify CORS configuration in worker
- **Loading issues**: Check bundle sizes and optimize if needed

### Authentication Issues
- **JWT errors**: Verify JWT_SECRET is set correctly
- **Login failures**: Check database connection and user table

## 📞 Support Contacts

- **Cloudflare Support**: For infrastructure issues
- **OpenRouter Support**: For AI model API issues
- **Your Team**: Internal escalation procedures

---

**Estimated Total Setup Time: 4-6 hours**
**Prerequisites: Cloudflare account, domain name, OpenRouter API key**