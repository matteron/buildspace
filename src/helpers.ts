export function distinct<T>(value: T, index: number, self: T[]) { 
    return self.indexOf(value) === index;
}