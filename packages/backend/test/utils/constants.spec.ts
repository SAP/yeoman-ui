import { expect } from "chai";
import { Constants } from "../../src/utils/constants"; // Adjust the import path as necessary

describe("constants unit testing", () => {
  describe("isURL unit testing", () => {
    // Valid absolute URL with http protocol returns true
    it("should return true when given valid http URL", () => {
      const url = "http://www.example.com";
      const result = Constants.isURL(url);
      expect(result).to.be.true;
    });
  });

  // Empty string returns false
  it("should return false when given empty string", () => {
    const url = "";
    const result = Constants.isURL(url);
    expect(result).to.be.false;
  });
});
