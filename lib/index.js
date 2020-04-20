"use strict";
const helpers_1 = require("./helpers");
const fs = require("fs");
const path = require("path");
class BuildSpace {
    constructor(options) {
        this.pages = [];
        this.options = {
            outputDir: 'out'
        };
        this.enter = () => this.build();
        if (options) {
            Object.assign(this.options, options);
        }
    }
    setDefaultTemplate(tCtor) {
        this.defaultTemplate = new tCtor();
    }
    register(pCtor, tCtor) {
        let page = new pCtor();
        if (tCtor) {
            page.template = new tCtor();
        }
        else if (this.defaultTemplate) {
            page.template = this.defaultTemplate;
        }
        else {
            console.error('Page not added.  Template Constructor not valid and Default Template not Registered.');
        }
        this.pages.push(page);
    }
    bulkRegister(pages) {
        pages.forEach(p => {
            p.template = this.defaultTemplate;
            this.pages.push(p);
        });
    }
    addPreprocessor(callback) {
        this.preprocessor = callback;
    }
    addPostprocessor(callback) {
        this.postprocessor = callback;
    }
    makeDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            console.log('Directory Exists: ' + dirPath);
        }
        else {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    makeDirectories() {
        // pull out the path before the last
        this.makeDirectory(this.options.outputDir);
        this.pages.map(p => p.path.substring(0, p.path.lastIndexOf('/'))).filter(helpers_1.distinct).forEach(dir => {
            this.makeDirectory(path.join(this.options.outputDir, dir));
        });
    }
    allStyleSheets() {
        // return this.pages.flatMap(p => p.stylesheets ?? ['']).filter(distinct);
        return [];
    }
    compilePage(page) {
        return page.template ? page.template.build(page.data) : '';
    }
    writeToFile(location, contents) {
        fs.writeFileSync(path.join(this.options.outputDir, location) + '.html', contents);
    }
    build() {
        if (this.preprocessor) {
            this.preprocessor(this);
        }
        this.makeDirectories();
        this.pages.forEach(p => this.writeToFile(p.path, this.compilePage(p)));
        if (this.postprocessor) {
            this.postprocessor(this);
        }
    }
}
module.exports = BuildSpace;
