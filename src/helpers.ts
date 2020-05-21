import * as path from 'path';

export function distinct<T>(value: T, index: number, self: T[]) { 
    return self.indexOf(value) === index;
}

export function normalizedJoin(...args: string[]): string {
    return path.normalize(path.join(...args));
}