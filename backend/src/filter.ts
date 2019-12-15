import * as _ from "lodash";

export enum GeneratorType {
    project = "project", 
    module = "module"
}

export class GeneratorFilter {
    private constructor(public type?: GeneratorType,
    public cetegories: string[] = []) {}

    public static create(filterObject: any) {
        const genType: GeneratorType = _.get(filterObject, "type");
        if (_.includes(_.values(GeneratorType), genType)) {
            return new GeneratorFilter(genType);
        }

        return new GeneratorFilter();
    }
}
