# Firebase Storage CORS Configuration

If you encounter issues with image uploads in the WUSA Auction Manager, it's likely due to Firebase Storage CORS (Cross-Origin Resource Sharing) configuration. This guide will help you fix it.

## What is CORS?

CORS is a security policy that restricts web applications from making requests to resources hosted on different domains. When your app tries to upload images to Firebase Storage, the browser may block these requests if CORS isn't properly configured.

## Symptoms

- Image uploads fail with CORS errors in the browser console
- Error messages like "Access to fetch at '...' has been blocked by CORS policy"
- The application shows CORS-related error messages

## Solution

### Option 1: Use the Built-in CORS Fix Page

1. Run your application (`npm run dev`)
2. Navigate to `/cors-fix` in your browser (e.g., `http://localhost:9002/cors-fix`)
3. Follow the step-by-step instructions shown on the page

### Option 2: Manual Configuration

1. **Install Google Cloud SDK**
   
   Download and install the Google Cloud SDK from: https://cloud.google.com/sdk/docs/install

2. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   ```

3. **Create a cors.json file**
   
   Create a file named `cors.json` with the following content:
   ```json
   [
     {
       "origin": ["http://localhost:9002", "https://your-domain.com"],
       "method": ["GET", "POST", "PUT", "HEAD"],
       "responseHeader": [
         "Content-Type",
         "Access-Control-Allow-Origin"
       ],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   
   Replace `https://your-domain.com` with your actual domain if deploying to production.

4. **Apply CORS configuration**
   ```bash
   gcloud storage buckets update gs://studio-2256766213-a72a9.appspot.com --cors-file=cors.json
   ```

## Verification

After applying the CORS configuration:

1. Restart your application
2. Try uploading an image
3. Check that uploads work without CORS errors

## Additional Resources

- [Firebase Storage CORS Documentation](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Google Cloud Storage CORS Documentation](https://cloud.google.com/storage/docs/cross-origin)

## Need Help?

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify that the Google Cloud SDK is properly installed and authenticated
3. Ensure you're using the correct Firebase Storage bucket name
4. Contact the development team for assistance