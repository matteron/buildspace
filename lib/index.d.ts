import { Template, Page } from "./types/structure";
interface Options {
    outputDir: string;
}
declare class BuildSpace {
    pages: Page<any>[];
    private defaultTemplate?;
    private preprocessor?;
    private postprocessor?;
    options: Options;
    constructor(options?: Partial<Options>);
    setDefaultTemplate<T extends Template<any>>(tCtor: new (...args: any[]) => T): void;
    register<D, P extends Page<D>, T extends Template<D>>(pCtor: new (...args: any[]) => P, tCtor?: new (...args: any[]) => T): void;
    bulkRegister(pages: Page<any>[]): void;
    addPreprocessor(callback: (bs: BuildSpace) => any): void;
    addPostprocessor(callback: (bs: BuildSpace) => any): void;
    makeDirectory(dirPath: string): void;
    makeDirectories(): void;
    allStyleSheets(): string[];
    compilePage<D>(page: Page<D>): string;
    writeToFile(location: string, contents: string): void;
    build(): void;
    enter: () => void;
}
export = BuildSpace;
