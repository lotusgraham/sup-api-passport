var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var User = require('./models/user');
var Message = require('./models/message');

var app = express();

var jsonParser = bodyParser.json();

// Add your API endpoints here
app.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        if (err) {
            return res.sendStatus(500);
        }

        return res.json(users);
    });
});

app.post('/users', jsonParser, function(req, res) {
    if (!req.body.username) {
      var message = {
        message: 'Missing field: username'
     }
      return res.status(422).json(message);
    }

    if (typeof req.body.username != 'string' ){
        var message2 = { message: 'Incorrect field type: username'};

      return res.status(422).json(message2);
    }

    var user = new User({
        username: req.body.username,
    });

    user.save(function(err, user) {
      // res.body= {}
        if (err) {
            return res.sendStatus(500);
        }


        return res.status(201).location('/users/' + user._id).json({});
    });
});


app.get('/users/:userId', function(req, res) {
    User.findOne({
        _id: req.params.userId
    }, function(err, user) {
        if (err) {
            return res.sendStatus(500);
        }
        var message = {message: 'User not found'};
        if(!user) {
             return res.status(404).json(message);
        }

        return res.json(user);
    });
});

app.put('/users/:userId', jsonParser, function(req, res) {
    if (!req.body.username) {
      // return res.sendStatus(422);
      var message = {
        message: 'Missing field: username'
     };
      return res.status(422).json(message);
    }
    if (typeof req.body.username != 'string' ){
        var message2 = { message: 'Incorrect field type: username'};

      return res.status(422).json(message2)
    }
    var newUser = req.body;
    User.findByIdAndUpdate(req.params.userId, newUser, {upsert:true}, function(err) {
        if (err) {
            return res.sendStatus(500);
        }
        return res.status(200).json({});
    });
});

app.delete('/users/:userId', jsonParser, function(req, res) {
   User.findByIdAndRemove(req.params.userId, function(err, user) {
       if (err) {
         return res.sendStatus(500);
       }
       if (!user) {
         return res.status(404).json({message: 'User not found'});
       }
       return res.status(200).json({});
   });
});

//messages

app.get('/messages', function(req, res) {
  var fromFilter = req.query.from;
  var toFilter = req.query.to;

  var query = {};
  if(fromFilter) {
    query.from = fromFilter;
  }
  if(toFilter) {
    query.to = toFilter;
  }

  Message.find(query)
    .populate('from')
    .populate('to')
    .then(function(messages) {
      res.json(messages);
  });
});

app.get('/messages/:messageId', function(req, res) {
    Message.findOne({
        _id: req.params.messageId
    })
    .populate('from')
    .populate('to')
    .then(function(message, err) {
        if (err) {
            return res.sendStatus(500);
        }
        var errorMessage = {message: 'Message not found'};
        if(!message) {
             return res.status(404).json(errorMessage);
        }

        return res.json(message);
    });
});

app.post('/messages', jsonParser, function(req, res) {
    var message = new Message({
        from: req.body.from,
        to: req.body.to,
        text: req.body.text
    });
    if(!req.body.text) {
      var errorMessage = {message: 'Missing field: text'};
      return res.status(422).json(errorMessage);
    }

    if(typeof req.body.text != 'string') {
       errorMessage = {message: 'Incorrect field type: text'};
      return res.status(422).json(errorMessage);
    }

    if(typeof req.body.to != 'string') {
       var errorMessage = {message: 'Incorrect field type: to'};
      return res.status(422).json(errorMessage);
    }

    if(typeof req.body.from != 'string') {
       errorMessage = {message: 'Incorrect field type: from'};
      return res.status(422).json(errorMessage);
    }

    var fromCheck = User.findOne({
        _id: req.body.from
    });

    var toCheck = User.findOne({
        _id: req.body.to
    });

    return Promise.all([fromCheck,toCheck])
    .then(function(results){
      if (!results[0]) {
        var errorMessage = {message: 'Incorrect field value: from'};
        return res.status(422).json(errorMessage);
      } else if (!results[1]) {
         var errorMessage = {message: 'Incorrect field value: to'};
        return res.status(422).json(errorMessage);
      } else {
        return message.save(function(err, message) {
            if (err) {
                return res.sendStatus(500);
            }
            return res.status(201).location('/messages/' + message._id).json({});
        });
      }
  });
});

var databaseUri = global.databaseUri || 'mongodb://localhost/sup';
mongoose.connect(databaseUri).then(function() {
    app.listen(8080, function() {
        console.log('Listening on localhost:8080');
    });
});

module.exports = app;
