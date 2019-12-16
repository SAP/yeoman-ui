import * as _ from "lodash";

export enum GeneratorType {
    project = "project", 
    module = "module"
}

function getCategories(filterObject?: any): string[] {
    const categories: string[] = _.get(filterObject, 'categories', []);
    if (_.isArray(categories)) {
        const strValues = _.filter(categories, category => {
            return _.isString(category);
        });
        if (_.isEmpty(_.difference(categories, strValues))) {
            return categories;
        }
    }

    return [];
}

function getType(filterObject?: any): GeneratorType {
    const genType: GeneratorType = _.get(filterObject, "type");
    if (_.includes(_.values(GeneratorType), genType)) {
        return GeneratorType[genType];
    }
}

export class GeneratorFilter {
    constructor(public readonly  type?: GeneratorType,
                public readonly categories: string[] = []) {}

    public static create(filterObject?: any) {
        const categories: string[] = getCategories(filterObject); 
        const type: GeneratorType = getType(filterObject);

        return new GeneratorFilter(type, categories);
    }
}
