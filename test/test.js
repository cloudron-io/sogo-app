#!/usr/bin/env node

'use strict';

var execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    webdriver = require('selenium-webdriver');

var by = webdriver.By,
    Keys = webdriver.Key,
    until = webdriver.until;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (!process.env.USERNAME || !process.env.PASSWORD) {
    console.log('USERNAME and PASSWORD env vars need to be set');
    process.exit(1);
}

describe('Application life cycle test', function () {
    this.timeout(0);

    var firefox = require('selenium-webdriver/firefox');
    var server, browser = new firefox.Driver();

    before(function (done) {
        var seleniumJar= require('selenium-server-standalone-jar');
        var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
        server = new SeleniumServer(seleniumJar.path, { port: 4444 });
        server.start();

        done();
    });

    after(function (done) {
        browser.quit();
        server.stop();
        done();
    });

    var LOCATION = 'rctest';
    var TEST_MESSAGE = 'Hello Test!';
    var TEST_CHANNEL = 'general';
    var TEST_TIMEOUT = 5000;
    var app;

    xit('build app', function () {
        execSync('cloudron build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    xit('install app', function () {
        execSync('cloudron install --new --wait --location ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can get app information', function () {
        var inspect = JSON.parse(execSync('cloudron inspect'));

        app = inspect.apps.filter(function (a) { return a.location === LOCATION; })[0];

        expect(app).to.be.an('object');
    });

    it('can login', function (done) {
        browser.get('https://' + app.fqdn);
        browser.wait(until.elementLocated(by.id('input_1')), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(by.id('input_1'))), TEST_TIMEOUT).then(function () {
                browser.findElement(by.id('input_1')).sendKeys(process.env.USERNAME);
                browser.findElement(by.id('input_2')).sendKeys(process.env.PASSWORD);
                browser.findElement(by.name('loginForm')).submit();
                browser.wait(until.elementLocated(by.xpath('/html/body/main/section/div/div[1]/md-content/button')), TEST_TIMEOUT).then(function () { done(); });
            });
        });
    });

    xit('can join channel', function (done) {
        browser.get('https://' + app.fqdn + '/channel/' + TEST_CHANNEL);
        browser.wait(until.elementLocated(by.name('msg')), TEST_TIMEOUT).then(function () { done(); });
    });

    xit('can send message', function (done) {
        browser.get('https://' + app.fqdn + '/channel/' + TEST_CHANNEL);
        browser.wait(until.elementLocated(by.name('msg')), TEST_TIMEOUT).then(function () {
            browser.findElement(by.name('msg')).sendKeys(TEST_MESSAGE);
            browser.findElement(by.name('msg')).sendKeys(Keys.RETURN);
            browser.wait(browser.findElement(by.xpath("//*[contains(text(), '" + TEST_MESSAGE + "')]")), TEST_TIMEOUT).then(function () { done(); });
        });
    });

    xit('backup app', function () {
        execSync('cloudron backup --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    xit('restore app', function () {
        execSync('cloudron restore --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    xit('can login', function (done) {
        browser.get('https://' + app.fqdn + '/home');
        browser.wait(until.elementLocated(by.name('emailOrUsername')), TEST_TIMEOUT).then(function () {
            browser.findElement(by.name('emailOrUsername')).sendKeys(process.env.USERNAME);
            browser.findElement(by.name('pass')).sendKeys(process.env.PASSWORD);
            browser.findElement(by.id('login-card')).submit();
            browser.wait(until.elementLocated(by.className('room-title')), TEST_TIMEOUT).then(function () { done(); });
        });
    });

    xit('message is still there', function (done) {
        browser.get('https://' + app.fqdn + '/channel/' + TEST_CHANNEL);
        browser.wait(until.elementLocated(by.name('msg')), TEST_TIMEOUT).then(function () {
            browser.wait(browser.findElement(by.xpath("//*[contains(text(), '" + TEST_MESSAGE + "')]")), TEST_TIMEOUT).then(function () { done(); });
        });
    });

    xit('move to different location', function () {
        browser.manage().deleteAllCookies();
        execSync('cloudron install --location ' + LOCATION + '2', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location === LOCATION + '2'; })[0];
        expect(app).to.be.an('object');
    });

    xit('can login', function (done) {
        browser.get('https://' + app.fqdn + '/home');
        browser.wait(until.elementLocated(by.name('emailOrUsername')), TEST_TIMEOUT).then(function () {
            browser.findElement(by.name('emailOrUsername')).sendKeys(process.env.USERNAME);
            browser.findElement(by.name('pass')).sendKeys(process.env.PASSWORD);
            browser.findElement(by.id('login-card')).submit();
            browser.wait(until.elementLocated(by.className('room-title')), TEST_TIMEOUT).then(function () { done(); });
        });
    });

    xit('message is still there', function (done) {
        browser.get('https://' + app.fqdn + '/channel/' + TEST_CHANNEL);
        browser.wait(until.elementLocated(by.name('msg')), TEST_TIMEOUT).then(function () {
            browser.wait(browser.findElement(by.xpath("//*[contains(text(), '" + TEST_MESSAGE + "')]")), TEST_TIMEOUT).then(function () { done(); });
        });
    });

    xit('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });
});
