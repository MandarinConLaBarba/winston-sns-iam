var _ = require('underscore'),
    aws = require('aws-lib'),
    winston = require('winston'),
    util = require('util');

//required variables - winston-sns will not start without at least these options.
var required = ["topicArn"],
    optional = {
        // region - one of: "us-east-1","us-west-1","eu-west-1","ap-southeast-1","ap-northeast-1","us-gov-west-1","sa-east-1".
        "region" : "us-east-1",
        // default title for notification (%e, %l, and %m are available here, same as in subject.)
        "subject" : "Winston Error Report",
        // default message for notification (%l is the level, %e is the error text, %m is the metadata.)
        "message" : "Level '%l' Error:\n%e\n\nMetadata:\n%m",
        // standard winston variables
        "level" : "info",
        // handle exceptions?
        "handleExceptions" : false,
        // show json instead of inspecting
        "json" : false
    };

/**
 * SNS transport constructor
 *
 * @constructor
 */
var SNS = winston.transports.SNS = exports.SNS = function(options){
    // don't cause errors when options is empty
    options = options || {};
    // make sure we have the minimum required options
    var missing = [];
    required.forEach(function(r){
        if(!options.hasOwnProperty(r)) {
            missing.push(r);
        }
    });

    if(missing.length) {
        throw new Error("You must specify options: " + missing.join(",") + " to use winston-sns.");
    }

    /**
     * Set up defaults
     */
    this.options = _.defaults(options, optional);

    /**
     * Create SNS client
     */
    this.sns = aws.createSNSClient(
        this.options.accessKeyId,
        this.options.secretAccessKey);

    //transport name
    this.name = "SNSIAMTransport";
    //set up log levels
    this.level = this.options.level;
    //handle exceptions
    this.handleExceptions = this.options.handleExceptions;
};

//Inherit Winston's transport protocols
util.inherits(SNS, winston.Transport);

/**
 * Main logging method - called aliases logger.error, logger.info, etc
 *
 * @param level
 * @param msg
 * @param meta
 * @param callback
 */
SNS.prototype.log = function(level, msg, meta, callback){

    var self = this,
    //substitution method
        sub = function(str){
            var m = self.options.json ?
                JSON.stringify(meta) :
                util.inspect(meta, false, 5);
            return str.replace('%l',level)
                .replace('%e',msg)
                .replace('%m',m);
        };

    /**
     * SNS options
     */
    var snsOptions = {
        TopicArn : this.options.topicArn,
        Subject : sub(this.options.subject),
        Message : sub(this.options.message)
    };

    /**
     * Send SNS message
     */
    this.sns.call("Publish", snsOptions, callback);

};