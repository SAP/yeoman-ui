import * as _ from "lodash";

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

function getTypes(filterObject?: any): string[] {
    let types: string[] = [];
    const objectTypes: any = _.get(filterObject, "type");
    if (_.isString(objectTypes)) {
        types.push(objectTypes);
    }

    if (_.isArray(objectTypes)) {
        // leave only string values
        types = _.filter(objectTypes, type => {
            return _.isString(type);
        });
    }

    return _.compact(_.map(types, _.trim));
}

export class GeneratorFilter {
    public static create(filterObject?: any) {
        const categories: string[] = getCategories(filterObject); 
        const types: string[] = getTypes(filterObject);

        return new GeneratorFilter(types, categories);
    }

    constructor(public readonly types: string[], public readonly categories: string[]) {}
}
