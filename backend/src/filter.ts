import * as _ from "lodash";

export enum GeneratorType {
    project = "project", 
    module = "module"
}

export class GeneratorFilter {
    public constructor(public readonly type?: GeneratorType,
    public readonly cetegories: string[] = []) {}

    public static create(filterObject: any) {
        return new GeneratorFilter(_.get(filterObject, "type"), _.get(filterObject, "cetegories"));
    }
}
