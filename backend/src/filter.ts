export enum GeneratorType {
    project = "project", 
    module = "module"
}

export class GeneratorFilter {
    type?: GeneratorType;
    category?: string[];
}
