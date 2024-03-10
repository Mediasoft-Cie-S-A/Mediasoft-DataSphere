/*!
 * Copyright (c) 2023 Mediasoft & Cie S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

module.exports = function(app,session, passport) {


// Configure the local strategy for use by Passport.
 let strategy={
  identityMetadata: `https://login.microsoftonline.com/${app.config.authentication.azureAd.tenantId}/v2.0/.well-known/openid-configuration`,
  clientID: app.config.authentication.azureAd.clientId,
  responseType: 'code',
  responseMode: 'query',
  redirectUrl: 'http://localhost:3000/auth/openid/return',
  allowHttpForRedirectUrl: true,
  clientSecret: app.config.authentication.azureAd.clientSecret,
  validateIssuer: true,
  passReqToCallback: true,
  scope: ['profile']
};

console.log(strategy);

 // Configure the Azure AD strategy for Passport
passport.use(new OIDCStrategy(strategy,
  (req, iss, sub, profile, accessToken, refreshToken, params, done) => {
    if (!profile.oid) {
      return done(new Error("No oid found"), null);
    }
    // You can save the profile information to your user database here
    return done(null, profile);
  }
));


// Authentication request
app.get('/auth/openid',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login', 
  failureMessage: true // This enables failure messages to be provided when authentication fails.
 }),  
  (req, res) => {
    console.log('Authentication request'+ req);
    res.redirect('/');
  }
);


// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    req.logout();
    res.redirect('/');
  });
});

// ... [previous code]

// Authentication callback
app.get('/auth/openid/return', 
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login'    , 
  failureMessage: true // This enables failure messages to be provided when authentication fails.
 }),
   (req, res) => {
    // Authentication was successful
    // get username from req.user.oid
    console.log(req.user);
    const username = req.user.displayName;
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
      </head>
      <body>
        <h1>Authentication Successful</h1>
        <p>Welcome,${username}!</p>
        <a href="/Dashboard">Go to Home</a>
        <a href="/logout">Logout</a>
      </body>
      </html>
    `);
  }
);


  


};
