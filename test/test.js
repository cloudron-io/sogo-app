#!/usr/bin/env node

'use strict';

var execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    webdriver = require('selenium-webdriver');

var by = webdriver.By,
    until = webdriver.until;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (!process.env.USERNAME || !process.env.PASSWORD) {
    console.log('USERNAME and PASSWORD env vars need to be set');
    process.exit(1);
}

describe('Application life cycle test', function () {
    this.timeout(0);

    var chrome = require('selenium-webdriver/chrome');
    var server, browser = new chrome.Driver();

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

    var LOCATION = 'sogotest';
    var EVENT_TITLE = 'Meet the Cloudron Founders';
    var CONTACT_CN = 'Max Mustermann';
    var TEST_TIMEOUT = 50000;
    var app;

    xit('build app', function () {
        execSync('cloudron build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('install app', function () {
        execSync('cloudron install --new --wait --location ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can get app information', function () {
        var inspect = JSON.parse(execSync('cloudron inspect'));

        app = inspect.apps.filter(function (a) { return a.location === LOCATION; })[0];

        expect(app).to.be.an('object');
    });

    it('can login', function (done) {
        browser.manage().deleteAllCookies();
        browser.get('https://' + app.fqdn);

        browser.wait(until.elementLocated(by.id('input_1')), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(by.id('input_1'))), TEST_TIMEOUT).then(function () {
                browser.findElement(by.id('input_1')).sendKeys(process.env.USERNAME);
                browser.findElement(by.id('input_2')).sendKeys(process.env.PASSWORD);
                browser.findElement(by.name('loginForm')).submit();
                browser.wait(until.elementLocated(by.xpath('//*[@aria-label="New Event"]')), TEST_TIMEOUT).then(function () { done(); });
            });
        });
    });

    it('can create event', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Calendar/view');

        var elem = by.xpath('/html/body/main/section/div/div[1]/md-fab-speed-dial/md-fab-trigger');
        browser.wait(until.elementLocated(elem), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(elem)), TEST_TIMEOUT).then(function () {
                browser.findElement(elem).click();

                browser.sleep(2000).then(function () {

                    browser.wait(until.elementLocated(by.xpath('/html/body/main/section/div/div[1]/md-fab-speed-dial/md-fab-actions/div[1]/button')), TEST_TIMEOUT).then(function () {
                        browser.wait(until.elementIsVisible(browser.findElement(by.xpath('/html/body/main/section/div/div[1]/md-fab-speed-dial/md-fab-actions/div[1]/button'))), TEST_TIMEOUT).then(function () {
                            browser.findElement(by.xpath('/html/body/main/section/div/div[1]/md-fab-speed-dial/md-fab-actions/div[1]/button')).click();

                            browser.wait(until.elementLocated(by.xpath('//*[@ng-model="editor.component.summary"]')), TEST_TIMEOUT).then(function () {
                                browser.wait(until.elementIsVisible(browser.findElement(by.xpath('//*[@ng-model="editor.component.summary"]'))), TEST_TIMEOUT * 10).then(function () {
                                    browser.findElement(by.xpath('//*[@ng-model="editor.component.summary"]')).sendKeys(EVENT_TITLE);
                                    browser.findElement(by.xpath('//*[@ng-model="editor.component.summary"]')).submit();

                                    browser.wait(until.elementLocated(by.xpath('//*[@aria-label="' + EVENT_TITLE + '"]')), TEST_TIMEOUT).then(function () {
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('event is present', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Calendar/view');

        browser.wait(until.elementLocated(by.xpath('//*[@aria-label="' + EVENT_TITLE + '"]')), TEST_TIMEOUT).then(function () {
            done();
        });
    });

    it('can create contact', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Contacts/view#/addressbooks/personal/card/new');

        browser.wait(until.elementLocated(by.xpath('//*[@ng-model="editor.card.c_cn"]')), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(by.xpath('//*[@ng-model="editor.card.c_cn"]'))), TEST_TIMEOUT).then(function () {
                browser.findElement(by.xpath('//*[@ng-model="editor.card.c_cn"]')).sendKeys(CONTACT_CN);
                browser.findElement(by.xpath('//*[@aria-label="Save"]')).click();

                browser.wait(until.elementLocated(by.xpath('//*[text()="' + CONTACT_CN + '"]')), TEST_TIMEOUT).then(function () {
                    done();
                });
            });
        });
    });

    it('contact is present', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Contacts/view');

        browser.wait(until.elementLocated(by.xpath('//*[text()="' + CONTACT_CN + '"]')), TEST_TIMEOUT).then(function () {
            done();
        });
    });

    it('backup app', function () {
        execSync('cloudron backup --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('restore app', function () {
        execSync('cloudron restore --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can login', function (done) {
        browser.manage().deleteAllCookies();
        browser.get('https://' + app.fqdn);

        browser.wait(until.elementLocated(by.id('input_1')), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(by.id('input_1'))), TEST_TIMEOUT).then(function () {
                browser.findElement(by.id('input_1')).sendKeys(process.env.USERNAME);
                browser.findElement(by.id('input_2')).sendKeys(process.env.PASSWORD);
                browser.findElement(by.name('loginForm')).submit();
                browser.wait(until.elementLocated(by.xpath('//*[@aria-label="New Event"]')), TEST_TIMEOUT).then(function () { done(); });
            });
        });
    });

    it('event is still present', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Calendar/view');

        browser.wait(until.elementLocated(by.xpath('//*[@aria-label="' + EVENT_TITLE + '"]')), TEST_TIMEOUT).then(function () {
            done();
        });
    });

    it('contact is still present', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Contacts/view');

        browser.wait(until.elementLocated(by.xpath('//*[text()="' + CONTACT_CN + '"]')), TEST_TIMEOUT).then(function () {
            done();
        });
    });

    it('move to different location', function () {
        browser.manage().deleteAllCookies();
        execSync('cloudron install --location ' + LOCATION + '2', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location === LOCATION + '2'; })[0];
        expect(app).to.be.an('object');
    });

    it('can login', function (done) {
        browser.manage().deleteAllCookies();
        browser.get('https://' + app.fqdn);

        browser.wait(until.elementLocated(by.id('input_1')), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(by.id('input_1'))), TEST_TIMEOUT).then(function () {
                browser.findElement(by.id('input_1')).sendKeys(process.env.USERNAME);
                browser.findElement(by.id('input_2')).sendKeys(process.env.PASSWORD);
                browser.findElement(by.name('loginForm')).submit();
                browser.wait(until.elementLocated(by.xpath('//*[@aria-label="New Event"]')), TEST_TIMEOUT).then(function () { done(); });
            });
        });
    });

    it('event is still present', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Calendar/view');

        browser.wait(until.elementLocated(by.xpath('//*[@aria-label="' + EVENT_TITLE + '"]')), TEST_TIMEOUT).then(function () {
            done();
        });
    });

    it('contact is still present', function (done) {
        browser.get('https://' + app.fqdn + '/SOGo/so/' + process.env.USERNAME + '/Contacts/view');

        browser.wait(until.elementLocated(by.xpath('//*[text()="' + CONTACT_CN + '"]')), TEST_TIMEOUT).then(function () {
            done();
        });
    });

    it('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });
});
