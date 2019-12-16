import * as mocha from "mocha";
import { expect } from "chai";

import {GeneratorFilter, GeneratorType} from "../src/filter";

describe('filter unit test', () => {
    it('categories property is not of array type', () => {
        const genFilter: GeneratorFilter = GeneratorFilter.create({categories: {}});
        expect(genFilter.categories).to.be.deep.equal([]);
    });

    it('categories property array hold values other than strings', () => {
        const genFilter: GeneratorFilter = GeneratorFilter.create({categories: ["test", true, {}]});
        expect(genFilter.categories).to.be.deep.equal([]);
    });

    it('type property is not equal to any declared type property', () => {
        const testCategories: string[] = ["test1", "test2"];
        const genFilter: GeneratorFilter = GeneratorFilter.create({type: "test123", categories: testCategories});
        // tslint:disable-next-line: no-unused-expression
        expect(genFilter.type).to.be.equal(GeneratorType.all);
        expect(genFilter.categories).to.be.deep.equal(testCategories);
    });

    it('type property is project and category property has strings in array ', () => {
        const testCategories: string[] = ["test1", "test2"];
        const genFilter: GeneratorFilter = GeneratorFilter.create({type: "project", categories: testCategories});
        expect(genFilter.type).to.be.equal(GeneratorType.project);
        expect(genFilter.categories).to.be.deep.equal(testCategories);
    });

    it('type property is module and category property has strings in array ', () => {
        const testCategories: string[] = ["test1", "test2"];
        const genFilter: GeneratorFilter = GeneratorFilter.create({type: "module", categories: testCategories});
        expect(genFilter.type).to.be.equal(GeneratorType.module);
        expect(genFilter.categories).to.be.deep.equal(testCategories);
    });
});