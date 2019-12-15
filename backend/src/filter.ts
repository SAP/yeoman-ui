export enum GeneratorType {
    project = "project", 
    module = "module"
}

export class GeneratorFilter {
    constructor(public readonly type?: GeneratorType,
    public readonly category: string[] = []) {}
}
