const authenticateUser = require('../authentication').authenticateUser
const process = require('../nodemon.json')
const jwt = require('jsonwebtoken')

var chai = require('chai');
var should = chai.should();
describe('Authentication', function() {
    describe('#authenticateUser()', function() {
        const req = {
            token: ''
        }
        req.token = jwt.sign({
            email: 'email',
            _id: 'id'
        },
        process.env.JWT_KEY,
        {
            expiresIn: "1h"
        });
        it('should authenticate the request when the token is valid', function(done) {
                authenticateUser(req).then(
                function (result) {
                    result.authenticated.should.equal(true)
                    result.userdata.email.should.equal('email')
                    result.userdata._id.should.equal('id')
                    done();
                },
                function (err) {
                    done(err)
                }
            );
        }),
        it('should not authenticate the request without token', function(done) {
            req.token = ''
            authenticateUser(req).then(
                function (result) {
                    result.authenticated.should.equal(false)
                    done();
                },
                function (err) {
                    done(err)
                }
            );
        })
    })
})