var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'chatapp'
});

function ConnectToDB() {
    connection.connect(function(err) {
        if (err) {
            console.log("Error connecting to DB");
            return;
        }
        console.log("Connected to DB");
    });
}

function EndConnection() {
    connection.end();
}

module.exports = {
    ConnectToDB: function() {
        connection.connect(function(err) {
            if (err) {
                console.log("Error connecting to DB");
                return;
            }
        console.log("Connected to DB");
        });
    },

    EndConnection: function() {
        connection.end();
    },
    
    /**
     * callback(err, id)
     * id: the id of the user given username and password
     * If no such user exists, return -1.
     */
    FindUser: function(username, password, callback) {
        console.log("FindUser");
        var sql = "select * from users where username='" + username + "' and password='" + password + "'";
        console.log("ExecuteSQL: " + sql);
        var retVal = -1;
        connection.query(sql, function(err, results) {
            if (err) {
                console.log(err);
                callback(err);
            }
            console.log(results);
            if (results.length == 0) retVal = -1;
            else retVal = results[0].id;
            callback(err, retVal);
        });
    },

    /**
     * callback(err, username)
     * username: username of given id.
     */
    FindUserName: function(userid, callback) {
        console.log("FindUserName");
        var sql = "select username from users where id=" + userid;
        console.log("ExecuteSQL: " + sql);
        var retVal = "";
        connection.query(sql, function(err, results) {
            if (err) {
                console.log(err);
                callback(err);
            }
            if (results.length == 0) retVal = "";
            else retVal = results[0].username;
            callback(err, retVal);
        });
    },

    /**
     * callback(err, flag)
     * flag: 1 if successfully insert user into DB; 0 if failed (the username exists).
     */
    RegisterUser: function(username, password, callback) {
        console.log("RegUser");
        var sql = "insert into users(username, password) values('" + username + "', '" + password + "')";
        console.log("ExecuteSQL: " + sql);
        var retVal = -1;
        connection.query(sql, function(err) {
            if (err) {
                console.log(err);
                callback(err, 0);
            }
            retVal = 1;
            callback(err, 1);
        });
    },

    /**
     * callback(err, flag)
     * flag: 1 if successfully insert msg into DB; 0 if failed.
     */
    InsertMessage: function(id, content, send_time, callback) { // send_time should be in mysql format
        console.log("InsertMessage");
        var sql = "insert into messages(uid, content, send_time) values("+ id +", '"+ content +"', '"+ send_time +"')";
        console.log("ExecuteSQL: " + sql);
        var retVal = -1;
        try {
            connection.query(sql, function(err) {
                if (err) {
                    throw err;
                }
                retVal = 1;
                callback(err, 1);
            });
        }
        catch(err) {
            console.log("SQL query failed!");
            callback(err, 0);
        }
    },

    /**Retrieve all messages.
     * start: the index of the first message in all messages. starts from 0.
     * num: the number of retrieved messages.
     * callback(err, messages):
     * messages: 
     * a sorted JSON array: [ { id: xxx, content: xxx, send_time: xxx }, { ... } ... ] where the newest send_time comes first.
     */
    RetrieveAllMessages: function(start, num, callback) {
        console.log("RetrieveAllMessages");
        var sql = 'select * from messages left join users on messages.uid = users.id order by send_time desc limit ' + start + ', ' + num;
        console.log("ExecuteSQL: " + sql);
        var retVal;
        try {
            connection.query(sql, function(err, results) {
                if (err) {
                    throw err;
                }
                    console.log('total number of msgs: ' + results.length);
                    callback(err, results);
            });
        }
        catch(err) {
            console.log("SQL query failed!");
            callback(err);
        }
    },

    GetMessagesNumber: function(callback) {
        console.log('Get number of messages');
        var sql = 'select count(*) as msg_num from messages';
        console.log('Execute Sql: ' + sql);
        var retVal = 0;
        try {
            connection.query(sql, function(err, results) {
                if (err) {
                    throw err;
                }
                else {
                    retVal = results[0].msg_num;
                    console.log("Msg count: " + retVal);
                    callback(err, retVal);
                }
            });
        }
        catch(err) {
            console.log("SQL query failed!");
            callback(err);
        }
    }
}