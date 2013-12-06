/*

2013 Alan Languirand
@13protons

*/

var express = require('express')
    , lessMiddleware = require('less-middleware')
    , http = require('http')
    , url = require('url')
    , fs = require('fs')
    , path = require('path')
    , ejs = require('ejs')
    , passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy
    , app = express()
    , Firebase = require('firebase')
    , config = require('./config'); //make sure it's pointing in the right direction. config.js doesn't sync w/ git

    
    var fbURL = config['FIREBASE_FORGE']; //firebase endpoint
    
    //Configure sessions and passport
    app.use(express.cookieParser(config['SESSION_SECRET'])); //make it a good one
    app.use(express.session({secret: config['SESSION_SECRET']}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.favicon(__dirname + '/views/favicon.ico'));
    // Use the GitHubStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and GitHub
    //   profile), and invoke a callback with a user object.
    passport.use(new FacebookStrategy({
        clientID: config['FACEBOOK_CLIENT'],
        clientSecret: config['FACEBOOK_SECRET'],
        callbackURL: "http://localhost:3000/login/facebook/callback" //change for production
      },
      function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        
            //save provider, id, display
            var p = {
                "provider": profile.provider,
                "id": profile.id,
                "displayName": profile.displayName,
            }
            var user = new Firebase(fbURL + '/users/' + profile.id);
            user.once('value', function(snapshot){
                if(snapshot.val() == null){
                    //create that user
                    console.log('creating user...');
                    var users = new Firebase(fbURL + '/users');
                    users.child(p.id).set(p, function(e){
                        if(e){console.log('problem creating user', e);}
                        else{console.log('created user');}
                    });
                }
            });
            console.log('logged in: ', p);
            return done(null, p);
        
      }
    ));
    
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
        var user = new Firebase(fbURL + '/users/' + id);
        user.once('value', function(snapshot){
            done(null, snapshot.val());
        });
    }); 
    
	app.engine('.html', require('ejs').__express);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');
    
    //less is more? 
	app.use(lessMiddleware({
	    src      : __dirname + '/public',
	    compress : true
	  }));
    
	app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root

    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        if ('OPTIONS' == req.method) {
             res.send(200);
         } else {
             next();
         }
    });
    //default page
    app.get('/', function(req, res) {
        
        //show da map, yo!
        res.render('index', {});

	});

    app.get('/logout', function(req, res){
            if(typeof(req.query.last) == "undefined"){ req.session.last = '/'; }
            else{ req.session.last = req.query.last }
        
            req.logout();
            req.session['auth'] = false;
            res.redirect(req.session.last);
        });

    //Simple login
    //app.get('/auth/github', passport.authenticate('github'));

    //Handle "?last=x if available

app.get('/login/facebook', passport.authenticate('facebook'));
/*
    app.get('/login/facebook', function(req, res, next) {
        if(typeof(req.query.last) == "undefined"){ req.session.last = '/login'; }
        else{ req.session.last = req.query.last }
        
          passport.authenticate('facebook', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.redirect(req.session.last); }
            req.logIn(user, function(err) {
              if (err) { return next(err); }
              return res.redirect(req.session.last);
            });
          })(req, res, next);
    });
*/

    app.get('/login/facebook/callback', 
            
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      function(req, res) {
          req.session['auth'] = true;
          res.redirect("/");
        
      });


    app.get('/:page', function(req, res) {
        user = getUser(req);
	  	fs.stat(__dirname + '/views/' + req.params.page + ".ejs", function(err){
	  		if(err){
                console.log("error looking up: ", req.params.page);
				res.render('404', {
                    "page":  "not_found",
                    "user": user,
                    "name": "/404"
                });
	  		}else{
	  			res.render(__dirname + '/views/' + req.params.page + ".ejs", {
                    "page": "page",
                    "user": user,
                    "name": "/" + req.params.page
                });
	  			
	  		}
	  	});

	});

    /*
	app.locals({
	  table  : function(list) {
	    var template = fs.readFileSync(__dirname + '/views/table.ejs', 'utf-8');
	    return ejs.render(template, list);
	  },
      message: ""
    
	});
*/
	var port = process.env.PORT || 3000;
	app.listen(port);

	console.log('Listening on port %d', port);

    function getUser(req){
        var user = null;
        if(typeof(req.user) != 'undefined'){ 
            user = req.user ;
        }
        return user;
    }

function log(x){
    console.log(x);
}