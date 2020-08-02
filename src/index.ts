import { Template, Page } from "./types/structure";
import { distinct, normalizedJoin } from "./helpers";
import * as fs from 'fs';
import * as path from 'path';

interface Options {
    source: string;
    output: string;
    copy: string[];
}

type TConstructor<D> = new (...args: any[]) => Template<D>;
type PConstructor<D> = new (...args: any[]) => Page<D>;

export class BuildSpace {
    
    pages: Page<any>[] = [];
    private defaultTemplate?: Template<any>;

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

    setDefaultTemplate(tCtor: TConstructor<any>) {
        this.defaultTemplate = new tCtor();
    }

    register<D>(pCtor: PConstructor<D>, tCtor?: TConstructor<D>) {
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

    bulkRegister<D, P extends Page<D>>(pages: P[], tCtor?: TConstructor<D>) {
        const template = tCtor ? new tCtor() : this.defaultTemplate;
        pages.forEach(p => {
            p.template = template;
            this.pages.push(p);
        })
    }

    tunnelSrc(dir: string, fileCallback?: (file: string) => void, dirCallback?: (dir: string) => void) {
        const inputPath = normalizedJoin(this.options.source, dir);
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
        const loc = normalizedJoin(this.options.output, dir);
        this.makeDirectory(loc);
    }

    makeDirectories() {
        this.makeDirectory(this.options.output);
        this.pages.map(p => p.path.substring(0, p.path.lastIndexOf('/')))
            .filter(distinct)
            .forEach(dir => this.makeOutputDir(dir));
        this.options.copy.forEach(dir => {
            this.makeOutputDir(dir);
            this.tunnelSrc(dir, _ => {}, cur => {
                this.makeOutputDir(cur);
            });
        });
    }

    copyFile(file: string) {
        const src = normalizedJoin(this.options.source, file);
        const out = normalizedJoin(this.options.output, file);
        fs.copyFileSync(src, out);
    }

    copyDirectories() {
        this.options.copy.forEach(dir => 
            this.tunnelSrc(dir, file => this.copyFile(file))
        );
    }

    compilePage<D>(page: Page<D>): string {
        return page.template ? page.template.build(page.data) : '';
    }

    writeToFile(location: string, contents: string, ) {
        fs.writeFileSync(path.join(this.options.output, location), contents);
    }

    compilePages() {
        this.pages.forEach(p => this.writeToFile(p.path, this.compilePage(p)));
    }

    build() {
        this.makeDirectories();
        this.compilePages();
        this.copyDirectories();
    }
    enter = this.build;
}
