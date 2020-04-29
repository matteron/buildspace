import { Template, Page } from "./types/structure";
import { distinct } from "./helpers";
import * as fs from 'fs';
import * as path from 'path';

interface Options {
    inputDir: string;
    outputDir: string;
    copyDirs: string[];
}

class BuildSpace {
    
    pages: Page<any>[] = [];
    private defaultTemplate?: Template<any>;
    private preprocessor?: (bs: BuildSpace) => any;
    private postprocessor?: (bs: BuildSpace) => any;

    options: Options = {
        inputDir: 'src',
        outputDir: 'out',
        copyDirs: []
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

    makeDirectory(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    makeDirectories() {
        // pull out the path before the last
        this.makeDirectory(this.options.outputDir);
        this.pages.map(p => p.path.substring(0, p.path.lastIndexOf('/'))).filter(distinct).forEach(dir => 
            this.makeDirectory(path.join(this.options.outputDir, dir))
        );
        this.options.copyDirs.forEach(dir => this.makeDirectory(path.join(this.options.outputDir, dir)));
    }

    copyDirectories() {
        this.options.copyDirs.forEach(dir => {
            const inputPath = path.normalize(path.join(this.options.inputDir, dir));
            const outputPath = path.normalize(path.join(this.options.outputDir, dir));
            fs.readdirSync(path.normalize(inputPath)).forEach(f => {
                const src = path.normalize(path.join(inputPath, f));
                const out = path.normalize(path.join(outputPath, f));
                fs.copyFileSync(src, out);
            });
        })
    }

    allStyleSheets(): string[] {
        // return this.pages.flatMap(p => p.stylesheets ?? ['']).filter(distinct);
        return [];
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