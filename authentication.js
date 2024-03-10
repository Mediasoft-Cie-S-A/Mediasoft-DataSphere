module.exports = function(app,session, passport) {
    
      // allow passport to use "express-session".
 app.use(session({
    secret: app.config.sessionSecret,
    resave: false ,
    saveUninitialized: true ,
  }))
 
    // This is the basic express session({..}) initialization.
 app.use(passport.initialize()) 
 // init passport on every route call.
 app.use(passport.session())    


 passport.serializeUser((user, done) => {
    done(null, user.oid,user.username);
});

passport.deserializeUser((oid, username, done) => {
    // Find the user by OID and return the user object
    // Implement your logic to retrieve user from your database or user store
    done(null, { oid: oid, username: username });
});


};