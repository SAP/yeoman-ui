import * as mocha from "mocha";
import { expect } from "chai";

import {GeneratorFilter} from "../src/filter";

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
        expect(genFilter.types).to.contain("test123");
        expect(genFilter.categories).to.be.deep.equal(testCategories);
    });

    it('filter obj is undefined', () => {
        const genFilter: GeneratorFilter = GeneratorFilter.create(undefined);
        // tslint:disable-next-line: no-unused-expression
        expect(genFilter.types).to.be.empty;
        expect(genFilter.categories).to.be.deep.equal([]);
    });

    it('filter type is neither array nor string', () => {
        const genFilter: GeneratorFilter = GeneratorFilter.create({types: {}});
        // tslint:disable-next-line: no-unused-expression
        expect(genFilter.types).to.be.empty;
        expect(genFilter.categories).to.be.deep.equal([]);
    });

    it('type property is project and category property has strings in array ', () => {
        const testCategories: string[] = ["test1", "test2"];
        const genFilter: GeneratorFilter = GeneratorFilter.create({type: "project", categories: testCategories});
        expect(genFilter.types).to.contain("project");
        expect(genFilter.categories).to.be.deep.equal(testCategories);
    });

    it('type property is module and category property has strings in array ', () => {
        const testCategories: string[] = ["test1", "test2"];
        const genFilter: GeneratorFilter = GeneratorFilter.create({types: ["  module"], categories: testCategories});
        expect(genFilter.types).to.contain("module");
        expect(genFilter.categories).to.be.deep.equal(testCategories);
    });
});