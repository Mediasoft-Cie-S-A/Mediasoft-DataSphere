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



    authUser = (user, password, done) => {
        console.log(`Value of "User" in authUser function ----> ${user}`)         //passport will populate, user = req.body.username
        console.log(`Value of "Password" in authUser function ----> ${password}`) //passport will popuplate, password = req.body.password
            
            // 1. Check if user exists in config file
            // 2. Check if password is correct
            // 3. If both are correct, return user
            // 4. If not, return false
            // 5. If error, return error
        user = app.config.authentication.static.find( u => u.username === user && u.password === password) ;
            if (user) {
                console.log(`-------> User ${user} authenticated`)    
                // define authenticated_user object
                let authenticated_user = {}
                authenticated_user.oid = user.username;   
                authenticated_user.username=user.username;
                return done (null, authenticated_user ) 
            }
            else {
                console.log(`-------> User ${user} not authenticated`)
                return done (null, false, {message: "Incorrect username or password"})
            }
        }
     
    passport.use(new LocalStrategy (authUser))

     
    
    
    
    
    app.get("/login", (req, res) => {
        res.render("login.ejs")
    
    })
    
    app.delete("/logout", (req,res) => {
        req.logOut()
        res.redirect("/login")
        console.log(`-------> User Logged out`)
     })
    
    app.post ("/login", passport.authenticate('local', {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
    }))
    
    


    
     



};