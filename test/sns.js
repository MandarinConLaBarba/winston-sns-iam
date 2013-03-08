var _ = require("underscore"),
    sns = require('../lib/sns'),
    aws = require('aws-lib'),
    sinon = require('sinon'),
    should = require('should');



describe("winston-sns-iam", function(){

    var wrappedStubs;

    beforeEach(function() {
        wrappedStubs = {};
        wrappedStubs.createSNSClient = sinon.stub(aws, "createSNSClient");
    });

    afterEach(function() {
        _.invoke(wrappedStubs, "restore");
    });

    describe("constructor", function(){

        beforeEach(function() {

            this.client = {
                "blah" : "blah"
            };

            wrappedStubs.createSNSClient.returns(this.client);

        });

        describe("when sufficient arguments provided", function(){

            beforeEach(function() {
                this.options = {
                    level:'someLevel',
                    accessKeyId: "someKeyId",
                    secretAccessKey: "someSecret",
                    region:'us-east-1',
                    topicArn: "someTopicArn",
                    subject: "someSubject",
                    "handleExceptions" : true
                };

                this.transport = new sns.SNS(this.options);
            });

            it("should create an SNS client", function(){

                wrappedStubs.createSNSClient.called.should.be.true;

            });

            it("should pass aws credentials to the SNS client factory", function(){

                wrappedStubs.createSNSClient.firstCall.args[0]
                    .should.equal(this.options.accessKeyId);
                wrappedStubs.createSNSClient.firstCall.args[1]
                    .should.equal(this.options.secretAccessKey);

            });

            it("should set the sns property as the result of the SNS client factory", function(){

                this.transport.sns.should.equal(this.client);

            });

            it("should set the log level to the log level arg", function(){

                this.transport.level
                    .should.equal(this.options.level);

            });

            it("should set the handleException property to the handleException arg", function(){

                this.transport.handleExceptions
                    .should.be.true;

            });

        });

        describe("when no aws credentials provided", function(){

            it("should not throw an error", function(){

                (function() {

                    new sns.SNS({
                        topicArn: "someTopicArn",
                    });

                }).should.not.throw();


            });

        });

        describe("when topicArn argument is not provided", function(){

            it("should throw an exception", function(){

                (function() {

                    new sns.SNS({
                        level:'error',
                        accessKeyId: "someKeyId",
                        secretAccessKey: "someSecret",
                        region:'us-east-1',
                        subject: "someSubject"
                    });

                }).should.throw(/^.*topicArn/);

            });

        });

    });

    describe("log", function(){


        describe("in general", function(){

            beforeEach(function() {

                this.context = {
                    sns : {
                        call : sinon.stub()
                    },
                    options : {
                        topicArn : "someTopicArn",
                        subject : "someSubject",
                        message : "someMessage"
                    }
                };

                this.logCallback = sinon.stub();
                this.args = [
                    "info",
                    "someLogMessage",
                    {
                        "some" : "meta"
                    },
                    this.logCallback
                ];

                this.context.sns.call.withArgs("Publish").callsArg(2);

                sns.SNS.prototype.log.apply(this.context, this.args);

            });

            it("should call the Publish method on the SNS client", function(){


                this.context.sns.call.withArgs("Publish").called
                    .should.be.true;

            });

            it("should call the Publish method on the SNS client with the expected options", function(){

                var optionsPassed = this.context.sns.call.withArgs("Publish").firstCall.args[1];

                optionsPassed.TopicArn
                    .should.equal(this.context.options.topicArn);
                optionsPassed.Message
                    .should.equal(this.context.options.message);
                optionsPassed.Subject
                    .should.equal(this.context.options.subject);

            });

            it("should pass the winston log callback to the Publish method on the SNS client", function(){

                this.context.sns.call.withArgs("Publish").firstCall.args[2]
                    .should.equal(this.logCallback);

            });

        });


    });

});

