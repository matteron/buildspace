import { Template, Page } from "./types/structure";
import { distinct, normalizedJoin } from "./helpers";
import * as fs from 'fs';
import * as path from 'path';

interface Options {
    source: string;
    output: string;
    copy: string[];
}

class BuildSpace {
    
    pages: Page<any>[] = [];
    private defaultTemplate?: Template<any>;
    private preprocessor?: (bs: BuildSpace) => any;
    private postprocessor?: (bs: BuildSpace) => any;

    options: Options = {
        source: 'src',
        output: 'out',
        copy: []
    }

    constructor(options?: Partial<Options>) {
        if (options) {
            Object.assign(this.options, options);
        }
    }

    setDefaultTemplate<T extends Template<any>>(tCtor: new (...args: any[]) => T) {
        this.defaultTemplate = new tCtor();
    }

    register<D, P extends Page<D>, T extends Template<D>>(pCtor: new (...args: any[]) => P, tCtor?: new (...args: any[]) => T) {
        let page = new pCtor();
        if (tCtor) {
            page.template = new tCtor();
        } else if (this.defaultTemplate) {
            page.template = this.defaultTemplate;
        } else {
            console.error('Page not added.  Template Constructor not valid and Default Template not Registered.');    
        }
        
        this.pages.push(page);
    }

    bulkRegister(pages: Page<any>[]) {
        pages.forEach(p => {
            p.template = this.defaultTemplate;
            this.pages.push(p);
        })
    }

    addPreprocessor(callback: (bs: BuildSpace) => any) {
        this.preprocessor = callback;
    }

    addPostprocessor(callback: (bs: BuildSpace) => any) {
        this.postprocessor = callback;
    }

    tunnelSrc(dir: string, fileCallback?: (file: string) => void, dirCallback?: (dir: string) => void) {
        const inputPath = normalizedJoin(this.options.inputDir, dir);
        fs.readdirSync(inputPath).forEach(item => {
            const cur = normalizedJoin(dir, item);
            const loc = normalizedJoin(inputPath, item);
            const info = fs.lstatSync(loc);
            if (info.isDirectory()) {
                if (dirCallback) {
                    dirCallback(cur);
                }
                this.tunnelSrc(cur, fileCallback, dirCallback);
            } else if (info.isFile()) {
                if (fileCallback) {
                    fileCallback(cur);
                }
            }
        });
    }

    makeDirectory(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    makeOutputDir(dir: string) {
        const loc = normalizedJoin(this.options.outputDir, dir);
        this.makeDirectory(loc);
    }

    makeDirectories() {
        this.makeDirectory(this.options.outputDir);
        this.pages.map(p => p.path.substring(0, p.path.lastIndexOf('/')))
            .filter(distinct)
            .forEach(dir => this.makeOutputDir(dir));
        this.options.copyDirs.forEach(dir => {
            this.tunnelSrc(dir, _ => {}, cur => {
                this.makeOutputDir(cur);
            });
        });
    }

    copyFile(file: string) {
        const src = normalizedJoin(this.options.inputDir, file);
        const out = normalizedJoin(this.options.outputDir, file);
        fs.copyFileSync(src, out);
    }

    copyDirectories() {
        this.options.copyDirs.forEach(dir => 
            this.tunnelSrc(dir, file => this.copyFile(file))
        );
    }

    compilePage<D>(page: Page<D>): string {
        return page.template ? page.template.build(page.data) : '';
    }

    writeToFile(location: string, contents: string, ) {
        fs.writeFileSync(path.join(this.options.outputDir, location) + '.html', contents);
    }

    compilePages() {
        this.pages.forEach(p => this.writeToFile(p.path, this.compilePage(p)));
    }

    build() {
        if (this.preprocessor) {
            this.preprocessor(this);
        }
        this.makeDirectories();
        this.compilePages();
        this.copyDirectories();
        if (this.postprocessor) {
            this.postprocessor(this);
        }
    }
    enter = () => this.build();
}

export = BuildSpace;