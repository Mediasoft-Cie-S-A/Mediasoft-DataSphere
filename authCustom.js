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

const { authenticate } = require('passport');

const LocalStrategy = require('passport-local').Strategy;

module.exports = function(app,session, passport) {



    authUser = (user, token, done) => {
        console.log(`Value of "User" in authUser function ----> ${user}`)         //passport will populate, user = req.body.username
        console.log(`Value of "token" in authUser function ----> ${token}`) //passport will popuplate, password = req.body.password
            
        const headers = new Headers();
        const bearer = `Bearer ${token}`;
    
        headers.append("Authorization", bearer);
    
        const options = {
            method: "GET",
            headers: headers
        };
    
        console.log('request made to Graph API at: ' + new Date().toString());
    
        fetch(app.config.authentication.azureAd.graphMeEndpoint, options)
            .then(response => response.json())
            .then(  function (data){
              console.log(data);
              if (user==data.userPrincipalName  ) {
                  let authenticated_user = {}
                  authenticated_user.oid = data.id;   
                  authenticated_user.username=data.userPrincipalName;
                  return done (null, authenticated_user);
              }
            } )
            .catch(error => done(error, null));  


         
    }
     

    passport.use("custom", new LocalStrategy (authUser));
    
   
    
    
    app.post ("/customLogin", passport.authenticate('custom', { failureMessage: true // This enables failure messages to be provided when authentication fails.
}),
  (req, res) => {
   // Authentication was successful
   // get username from req.user.oid
   console.log(req.user);
   const username = req.user.displayName;
   res.send({authenticated: true, username: username});
 });
    

    
    

    
     



};