export interface Template<Data> {
    build: (data: Data) => string,
}

export interface Page<Data> {
    path: string;
    data: Data;
    template?: Template<Data>
}