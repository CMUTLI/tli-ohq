var router = require('express').Router();
//var passport = require('passport');
var auth = require('../../auth');
var fs = require('fs');
var cmushib = require('passport-cmushib')

//router.get('/cmushib', passport.authenticate('trusted-header', { successRedirect: '/#/courses',
//                                                                 failureRedirect: '/#/deny' }));

//app.get(loginUrl, passport.authenticate(strategy.name), cmushib.backToUrl());
//app.post(loginCallbackUrl, passport.authenticate(strategy.name), cmushib.backToUrl());
//app.get(cmushib.urls.metadata, cmushib.metadataRoute(strategy, publicCert));
var publicCert = fs.readFileSync('./secure/sp-cert.pem', 'utf-8');

//router.get('/Shibboleth.sso/Metadata', cmushib.metadataRoute(auth.passport.strategy, publicCert));
router.get(cmushib.urls.metadata, cmushib.metadataRoute(auth.passport.cmushib, publicCert));
//console.log(auth.passport.cmushib);
router.post('/callback', auth.passport.authenticate(auth.passport.cmushib.name), cmushib.backToUrl());
router.get('/cmushib', auth.passport.authenticate('cmushib', { successRedirect: '/#/courses',
                                                               failureRedirect: '/#/deny' }));

router.get('/endauth', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
