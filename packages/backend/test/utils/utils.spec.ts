import { expect } from "chai";
import { isURL } from "../../src/utils/utils";

describe("utils unit testing", () => {


    describe("isURL unit testing", () => {
        // Valid absolute URL with http protocol returns true
        it('should return true when given valid http URL', () => {
        const url = 'http://www.example.com';
        const result = isURL(url);
        expect(result).to.be.true;
        });
        
    })

    // Empty string returns false
    it('should return false when given empty string', () => {
        const url = '';
        const result = isURL(url);
        expect(result).to.be.false;
    });

})