export interface Template<Data> {
    build: (data: Data) => string;
    stylesheets?: string[];
}
export interface Page<Data> {
    name: string;
    path: string;
    data: Data;
    stylesheets?: string[];
    template?: Template<Data>;
}
